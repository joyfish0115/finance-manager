/**
 * 分類對應的 Material Symbol 名稱。
 * 圖示名稱列表：https://fonts.google.com/icons（風格選 Rounded）
 */
export const CATEGORY_ICON: Record<string, string> = {
  // 支出
  飲食: 'restaurant',
  飲料: 'local_cafe',
  交通: 'directions_subway',
  購物: 'shopping_bag',
  娛樂: 'sports_esports',
  醫療: 'medical_services',
  學習: 'school',
  居家: 'home',
  社交: 'groups',
  旅遊: 'flight',
  其他: 'category',
  // 收入
  薪資: 'payments',
  投資收益: 'trending_up',
  其他收入: 'savings',
}

export function getCategoryIcon(category: string): string {
  return CATEGORY_ICON[category] ?? 'receipt_long'
}
