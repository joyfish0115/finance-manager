/**
 * 固定金流 CRUD：定期定額（投資）+ 固定支出（訂閱、保險等）。
 *
 * 欄位順序（對應 sheetHeaders.recurring）：
 *   A = ID, B = 名稱, C = 類型, D = 金額, E = 扣款日,
 *   F = 帳戶（存 account UUID）, G = 持有總值, H = 報酬率
 *
 * 帳戶欄位存的是 Account.id（UUID），UI 顯示時再 join 帳戶資料。
 * 持有總值 / 報酬率 只在「投資」類型下使用，「固定支出」可留空。
 */

import { GOOGLE_CONFIG } from './config'
import { readSheetRows, appendRow, updateRow, deleteSheetRow } from './sheets'
import type { Recurring, RecurringKind } from '@/types'

const SHEET = GOOGLE_CONFIG.sheets.recurring

export type RecurringWithRow = Recurring & { _row: number }

// ─── 轉換函式 ─────────────────────────────────────────────────────────────────

function rowToRecurring(row: string[], sheetRowIndex: number): RecurringWithRow {
  const holdingValueRaw = row[6]
  const returnRateRaw = row[7]

  return {
    id: row[0] ?? '',
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
    _row: sheetRowIndex,
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

// ─── Public API ───────────────────────────────────────────────────────────────

/** 讀取所有固定金流（按扣款日排序） */
export async function fetchRecurring(): Promise<RecurringWithRow[]> {
  const rows = await readSheetRows(SHEET, GOOGLE_CONFIG.sheetHeaders.recurring)
  return rows
    .map((row, i) => rowToRecurring(row, i + 2))
    .filter((r) => r.id !== '')
    .sort((a, b) => a.dayOfMonth - b.dayOfMonth)
}

/** 新增固定金流 */
export async function addRecurring(data: Omit<Recurring, 'id'>): Promise<void> {
  const id = crypto.randomUUID()
  const r: Recurring = { id, ...data }
  await appendRow(SHEET, recurringToRow(r))
}

/** 更新固定金流 */
export async function updateRecurring(r: RecurringWithRow): Promise<void> {
  await updateRow(SHEET, r._row, recurringToRow(r))
}

/** 刪除固定金流 */
export async function deleteRecurring(rowIndex: number): Promise<void> {
  await deleteSheetRow(SHEET, rowIndex)
}
