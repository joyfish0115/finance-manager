export type AccountType = '活存' | '定存' | '證券戶' | '基金帳戶'

export interface Account {
  id: string
  bank: string
  name?: string
  type: AccountType
  balance: number
}

export type TransactionKind = '支出' | '收入'

export const EXPENSE_CATEGORIES = [
  '飲食',
  '飲料',
  '交通',
  '購物',
  '娛樂',
  '醫療',
  '學習',
  '居家',
  '社交',
  '旅遊',
  '其他',
] as const

export const INCOME_CATEGORIES = ['薪資', '投資收益', '其他收入'] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number]
export type TransactionCategory = ExpenseCategory | IncomeCategory

export interface Transaction {
  id: string
  date: string // ISO yyyy-MM-dd
  kind: TransactionKind
  category: TransactionCategory
  amount: number
  note?: string
}

export type RecurringKind = '投資' | '固定支出'

export interface Recurring {
  id: string
  name: string
  kind: RecurringKind
  amount: number
  dayOfMonth: number // 1-31
  accountId: string
  /** 投資類才有 */
  holdingValue?: number
  /** 投資類才有，百分比，例如 5.2 表示 5.2% */
  returnRate?: number
}
