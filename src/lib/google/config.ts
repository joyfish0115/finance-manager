/**
 * Google OAuth + API 設定。
 *
 * Client ID 是公開資訊（會出現在瀏覽器網址列、network 請求裡），
 * 直接寫在原始碼裡是業界標準做法。
 *
 * 本 App 使用 Google Identity Services (GIS) Token Model：
 *   - 完全不需要 Client Secret
 *   - 授權來源（Authorized JavaScript origins）白名單由 Google Cloud Console 控管
 *   - 使用者在 Google 登入時親自授權
 */

export const GOOGLE_CONFIG = {
  clientId:
    '589925898611-rejohvq9bsnijrloq9n53v36qes8i1pf.apps.googleusercontent.com',

  /**
   * 寫死資料儲存的試算表 ID。
   * 想換成另一份試算表的話，把網址 /d/ 和 /edit 之間那串貼進來即可。
   */
  sheetId: '17Isf_J0hqdcsfzqAeDomnTqeOqbOMRYc0QzjHszKjM8',

  /** OAuth 授權範圍：只需要讀寫試算表的權限 */
  scopes: 'https://www.googleapis.com/auth/spreadsheets',

  /** 三個工作表的名稱，必須跟試算表內實際的工作表名一致 */
  sheets: {
    accounts: '帳戶',
    transactions: '記帳',
    recurring: '固定金流',
  },

  /** 三個工作表的欄位標題列（第一列） */
  sheetHeaders: {
    accounts: ['ID', '銀行', '名稱', '類型', '餘額'],
    transactions: ['ID', '日期', '類型', '分類', '金額', '備註'],
    recurring: [
      'ID',
      '名稱',
      '類型',
      '金額',
      '扣款日',
      '帳戶',
      '持有總值',
      '報酬率',
    ],
  },
} as const
