/** 金額格式化：1234567 → "NT$ 1,234,567" */
export function formatCurrency(amount: number): string {
  return `NT$ ${amount.toLocaleString('zh-TW')}`
}

/** 隱私模式下的金額遮蔽字串（不顯示真實數字） */
export const MASKED_AMOUNT = 'NT$ ••••••'

/** 依照 hidden 旗標決定是否顯示真實金額。被遮蔽時回傳 ••••••。 */
export function formatCurrencyMaybeHidden(amount: number, hidden: boolean): string {
  return hidden ? MASKED_AMOUNT : formatCurrency(amount)
}

/** 不含貨幣符號的格式化：1234567 → "1,234,567" */
export function formatNumber(amount: number): string {
  return amount.toLocaleString('zh-TW')
}

/** 百分比：5.234 → "5.23%" */
export function formatPercent(value: number, fractionDigits = 2): string {
  return `${value.toFixed(fractionDigits)}%`
}
