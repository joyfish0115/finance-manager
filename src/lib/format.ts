/** 金額格式化：1234567 → "NT$ 1,234,567" */
export function formatCurrency(amount: number): string {
  return `NT$ ${amount.toLocaleString('zh-TW')}`
}

/** 不含貨幣符號的格式化：1234567 → "1,234,567" */
export function formatNumber(amount: number): string {
  return amount.toLocaleString('zh-TW')
}

/** 百分比：5.234 → "5.23%" */
export function formatPercent(value: number, fractionDigits = 2): string {
  return `${value.toFixed(fractionDigits)}%`
}
