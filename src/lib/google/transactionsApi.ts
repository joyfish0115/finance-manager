/**
 * 記帳 CRUD：把 Google Sheet 的原始字串列轉換成 Transaction 物件，反之亦然。
 *
 * 欄位順序（對應 sheetHeaders.transactions）：
 *   A = ID, B = 日期, C = 類型, D = 分類, E = 金額, F = 備註
 */

import { GOOGLE_CONFIG } from './config'
import { readSheetRows, appendRow, updateRow, deleteSheetRow } from './sheets'
import type { Transaction, TransactionKind, TransactionCategory } from '@/types'

const SHEET = GOOGLE_CONFIG.sheets.transactions

export type TransactionWithRow = Transaction & { _row: number }

// ─── 轉換函式 ─────────────────────────────────────────────────────────────────

function rowToTransaction(row: string[], sheetRowIndex: number): TransactionWithRow {
  return {
    id: row[0] ?? '',
    date: row[1] ?? '',
    kind: (row[2] as TransactionKind) ?? '支出',
    category: (row[3] as TransactionCategory) ?? '其他',
    amount: Number(row[4]) || 0,
    note: row[5] || undefined,
    _row: sheetRowIndex,
  }
}

function transactionToRow(t: Transaction): (string | number)[] {
  return [t.id, t.date, t.kind, t.category, t.amount, t.note ?? '']
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** 讀取所有記帳（最新的在前） */
export async function fetchTransactions(): Promise<TransactionWithRow[]> {
  const rows = await readSheetRows(SHEET, GOOGLE_CONFIG.sheetHeaders.transactions)
  return rows
    .map((row, i) => rowToTransaction(row, i + 2))
    .filter((t) => t.id !== '')
    .sort((a, b) => b.date.localeCompare(a.date))
}

/** 新增一筆記帳 */
export async function addTransaction(data: Omit<Transaction, 'id'>): Promise<void> {
  const id = crypto.randomUUID()
  const t: Transaction = { id, ...data }
  await appendRow(SHEET, transactionToRow(t))
}

/** 更新一筆記帳（需指定原本的 _row 與完整資料） */
export async function updateTransaction(
  rowIndex: number,
  data: Transaction,
): Promise<void> {
  await updateRow(SHEET, rowIndex, transactionToRow(data))
}

/** 刪除一筆記帳 */
export async function deleteTransaction(rowIndex: number): Promise<void> {
  await deleteSheetRow(SHEET, rowIndex)
}
