/**
 * 帳戶 CRUD：把 Google Sheet 的原始字串列轉換成 Account 物件，反之亦然。
 *
 * 欄位順序（對應 sheetHeaders.accounts）：
 *   A = ID, B = 銀行, C = 名稱, D = 類型, E = 餘額
 *
 * _row：該筆資料在試算表的實際列號（從 2 開始，1 是標題列），
 *        供 updateRow / deleteSheetRow 使用。
 */

import { GOOGLE_CONFIG } from './config'
import { readSheetRows, appendRow, updateRow, deleteSheetRow } from './sheets'
import type { Account, AccountType } from '@/types'

const SHEET = GOOGLE_CONFIG.sheets.accounts

// AccountWithRow 多一個 _row 讓 update / delete 知道要操作哪一列
export type AccountWithRow = Account & { _row: number }

// ─── 轉換函式 ─────────────────────────────────────────────────────────────────

function rowToAccount(row: string[], sheetRowIndex: number): AccountWithRow {
  return {
    id: row[0] ?? '',
    bank: row[1] ?? '',
    name: row[2] || undefined,
    type: (row[3] as AccountType) ?? '活存',
    balance: Number(row[4]) || 0,
    _row: sheetRowIndex,
  }
}

function accountToRow(acc: Account): (string | number)[] {
  return [acc.id, acc.bank, acc.name ?? '', acc.type, acc.balance]
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** 讀取所有帳戶（如果工作表不存在，自動建立並寫入標題列） */
export async function fetchAccounts(): Promise<AccountWithRow[]> {
  const rows = await readSheetRows(SHEET, GOOGLE_CONFIG.sheetHeaders.accounts)
  return rows
    .map((row, i) => rowToAccount(row, i + 2)) // i+2 因為第 1 列是標題
    .filter((a) => a.id !== '')
}

/** 新增帳戶（自動產生 UUID） */
export async function addAccount(data: Omit<Account, 'id'>): Promise<void> {
  const id = crypto.randomUUID()
  const acc: Account = { id, ...data }
  await appendRow(SHEET, accountToRow(acc))
}

/** 更新帳戶（需要 _row 才能定位到正確列） */
export async function updateAccount(acc: AccountWithRow): Promise<void> {
  await updateRow(SHEET, acc._row, accountToRow(acc))
}

/** 刪除帳戶 */
export async function deleteAccount(rowIndex: number): Promise<void> {
  await deleteSheetRow(SHEET, rowIndex)
}
