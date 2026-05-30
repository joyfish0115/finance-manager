/**
 * 同步引擎：在本地 IndexedDB 和 Google Sheet 之間搬資料。
 *
 * 設計原則：使用者只用一台手機，所以衝突處理採「本地優先」最簡單版。
 *
 * 同步流程（一次按鈕觸發）：
 *
 *   1. PULL：從 Google Sheet 讀取目前所有列，建立 id → rowIndex 的對照表
 *      - 找出 sheet 有、本地沒有的 → 加進本地（標 'synced'）
 *      - 找出本地是 'synced' 但 sheet 沒有 → 從 sheet 端被刪了，從本地也移除
 *      - 本地有 pending-* 的不動（等下面 push 處理）
 *
 *   2. PUSH：把本地所有 pending-* 的變動推到 sheet
 *      - pending-create → appendRow，然後本地標 'synced'
 *      - pending-update → 用 id 找到 rowIndex，updateRow，然後本地標 'synced'
 *      - pending-delete → 用 id 找到 rowIndex，deleteSheetRow，然後本地真的刪掉
 *      ⚠ 刪除會改變後面 row 的 index，所以一次同步中要從大到小刪
 *
 *   3. 記錄 lastSyncedAt
 */

import type { Table } from 'dexie'
import { GOOGLE_CONFIG } from '@/lib/google/config'
import {
  readSheetRows,
  appendRow,
  updateRow,
  deleteSheetRow,
} from '@/lib/google/sheets'
import {
  db,
  META_KEYS,
  setMeta,
  type LocalTransaction,
  type LocalAccount,
  type LocalRecurring,
} from '@/lib/db/schema'
import type {
  Transaction,
  TransactionKind,
  TransactionCategory,
  Account,
  AccountType,
  Recurring,
  RecurringKind,
} from '@/types'

// ─── Row ↔ Object 轉換 ───────────────────────────────────────────────────────

function rowToTransaction(row: string[]): Transaction | null {
  const id = row[0]
  if (!id) return null
  return {
    id,
    date: row[1] ?? '',
    kind: (row[2] as TransactionKind) ?? '支出',
    category: (row[3] as TransactionCategory) ?? '其他',
    amount: Number(row[4]) || 0,
    note: row[5] || undefined,
  }
}

function transactionToRow(t: Transaction): (string | number)[] {
  return [t.id, t.date, t.kind, t.category, t.amount, t.note ?? '']
}

function rowToAccount(row: string[]): Account | null {
  const id = row[0]
  if (!id) return null
  return {
    id,
    bank: row[1] ?? '',
    name: row[2] || undefined,
    type: (row[3] as AccountType) ?? '活存',
    balance: Number(row[4]) || 0,
  }
}

function accountToRow(a: Account): (string | number)[] {
  return [a.id, a.bank, a.name ?? '', a.type, a.balance]
}

function rowToRecurring(row: string[]): Recurring | null {
  const id = row[0]
  if (!id) return null
  const holdingValueRaw = row[6]
  const returnRateRaw = row[7]
  return {
    id,
    name: row[1] ?? '',
    kind: (row[2] as RecurringKind) ?? '固定支出',
    amount: Number(row[3]) || 0,
    dayOfMonth: Number(row[4]) || 1,
    accountId: row[5] ?? '',
    holdingValue:
      holdingValueRaw && holdingValueRaw !== ''
        ? Number(holdingValueRaw) || 0
        : undefined,
    returnRate:
      returnRateRaw && returnRateRaw !== ''
        ? Number(returnRateRaw) || 0
        : undefined,
  }
}

function recurringToRow(r: Recurring): (string | number)[] {
  return [
    r.id,
    r.name,
    r.kind,
    r.amount,
    r.dayOfMonth,
    r.accountId,
    r.holdingValue ?? '',
    r.returnRate ?? '',
  ]
}

// ─── 通用同步邏輯 ────────────────────────────────────────────────────────────

interface TableSync<TLocal extends { id: string; syncStatus: string }, T> {
  sheetName: string
  headers: readonly string[]
  table: Table<TLocal, string>
  rowToObj: (row: string[]) => T | null
  objToRow: (obj: T) => (string | number)[]
  /** 把純 T（從 sheet 來）轉成 LocalT（加 syncStatus: 'synced'） */
  toLocal: (obj: T) => TLocal
}

async function syncTable<TLocal extends { id: string; syncStatus: string }, T extends { id: string }>(
  cfg: TableSync<TLocal, T>,
): Promise<void> {
  // 1. PULL — 讀 sheet
  const sheetRows = await readSheetRows(cfg.sheetName, cfg.headers)
  // 建立：id → { obj, rowIndex } 對照表（rowIndex 從 2 開始：1 是標題列）
  const sheetMap = new Map<string, { obj: T; rowIndex: number }>()
  sheetRows.forEach((row, i) => {
    const obj = cfg.rowToObj(row)
    if (obj) sheetMap.set(obj.id, { obj, rowIndex: i + 2 })
  })

  const localRows = (await cfg.table.toArray()) as TLocal[]
  const localMap = new Map<string, TLocal>(localRows.map((r) => [r.id, r]))

  // 1a. sheet 有 / 本地沒有 → 加進本地
  for (const [id, { obj }] of sheetMap) {
    if (!localMap.has(id)) {
      await cfg.table.add(cfg.toLocal(obj))
    }
  }

  // 1b. 本地是 synced 但 sheet 沒有 → sheet 端被刪了，本地也移除
  for (const local of localRows) {
    if (local.syncStatus === 'synced' && !sheetMap.has(local.id)) {
      await cfg.table.delete(local.id)
    }
  }
  // 註：pending-* 的就算 sheet 沒有也保留，下面 push 階段處理

  // 2. PUSH — 把 pending-* 推到 sheet
  // 重新讀一次本地（因為 1a 可能加了新項目，但那些是從 sheet 來的，狀態是 synced，不會被下面處理到）
  const pendingRows = (await cfg.table
    .where('syncStatus')
    .notEqual('synced')
    .toArray()) as TLocal[]

  // 2a. pending-create
  for (const local of pendingRows) {
    if (local.syncStatus !== 'pending-create') continue
    const { syncStatus: _s, ...obj } = local as TLocal & { syncStatus: string }
    await appendRow(cfg.sheetName, cfg.objToRow(obj as unknown as T))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await cfg.table.update(local.id, { syncStatus: 'synced' } as any)
  }

  // 2b. pending-update（用 id 對照 sheetMap 找 rowIndex）
  for (const local of pendingRows) {
    if (local.syncStatus !== 'pending-update') continue
    const sheetEntry = sheetMap.get(local.id)
    if (!sheetEntry) {
      // sheet 端找不到 → 視為新建
      const { syncStatus: _s, ...obj } = local as TLocal & { syncStatus: string }
      await appendRow(cfg.sheetName, cfg.objToRow(obj as unknown as T))
    } else {
      const { syncStatus: _s, ...obj } = local as TLocal & { syncStatus: string }
      await updateRow(cfg.sheetName, sheetEntry.rowIndex, cfg.objToRow(obj as unknown as T))
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await cfg.table.update(local.id, { syncStatus: 'synced' } as any)
  }

  // 2c. pending-delete（要從大 rowIndex 到小，避免刪除後 index 位移）
  const deletes = pendingRows
    .filter((l) => l.syncStatus === 'pending-delete')
    .map((l) => ({ local: l, rowIndex: sheetMap.get(l.id)?.rowIndex }))
    .filter((d): d is { local: TLocal; rowIndex: number } => d.rowIndex !== undefined)
    .sort((a, b) => b.rowIndex - a.rowIndex)

  for (const d of deletes) {
    await deleteSheetRow(cfg.sheetName, d.rowIndex)
    await cfg.table.delete(d.local.id)
  }

  // sheet 端找不到的 pending-delete → 直接從本地刪
  const ghostDeletes = pendingRows.filter(
    (l) => l.syncStatus === 'pending-delete' && !sheetMap.has(l.id),
  )
  for (const g of ghostDeletes) {
    await cfg.table.delete(g.id)
  }
}

// ─── 各表設定 ────────────────────────────────────────────────────────────────

const txnSync: TableSync<LocalTransaction, Transaction> = {
  sheetName: GOOGLE_CONFIG.sheets.transactions,
  headers: GOOGLE_CONFIG.sheetHeaders.transactions,
  table: db.transactions as unknown as Table<LocalTransaction, string>,
  rowToObj: rowToTransaction,
  objToRow: transactionToRow,
  toLocal: (t) => ({ ...t, syncStatus: 'synced' }),
}

const accSync: TableSync<LocalAccount, Account> = {
  sheetName: GOOGLE_CONFIG.sheets.accounts,
  headers: GOOGLE_CONFIG.sheetHeaders.accounts,
  table: db.accounts as unknown as Table<LocalAccount, string>,
  rowToObj: rowToAccount,
  objToRow: accountToRow,
  toLocal: (a) => ({ ...a, syncStatus: 'synced' }),
}

const recSync: TableSync<LocalRecurring, Recurring> = {
  sheetName: GOOGLE_CONFIG.sheets.recurring,
  headers: GOOGLE_CONFIG.sheetHeaders.recurring,
  table: db.recurring as unknown as Table<LocalRecurring, string>,
  rowToObj: rowToRecurring,
  objToRow: recurringToRow,
  toLocal: (r) => ({ ...r, syncStatus: 'synced' }),
}

// ─── 對外 API ────────────────────────────────────────────────────────────────

/** 立即同步全部三張表。失敗會 throw，已成功的部分不會 rollback。 */
export async function syncNow(): Promise<void> {
  // 依序同步（不平行，避免 Google API quota 問題 & 確保錯誤訊息順序清晰）
  await syncTable(accSync)
  await syncTable(recSync)
  await syncTable(txnSync)
  await setMeta(META_KEYS.lastSyncedAt, new Date().toISOString())
}

/** 統計本地有多少筆待同步（含 pending-create / update / delete） */
export async function countPending(): Promise<number> {
  const [t, a, r] = await Promise.all([
    db.transactions.where('syncStatus').notEqual('synced').count(),
    db.accounts.where('syncStatus').notEqual('synced').count(),
    db.recurring.where('syncStatus').notEqual('synced').count(),
  ])
  return t + a + r
}
