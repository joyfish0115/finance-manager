/**
 * Google OAuth + API 設定。
 *
 * Client ID 是公開資訊（會出現在瀏覽器網址列、network 請求裡），
 * 不像密碼那樣需要保密。直接寫在原始碼裡是業界標準做法。
 *
 * 真正的安全是靠：
 *   1. PKCE 流程（不需要 Client Secret）
 *   2. Google Cloud Console 設定的「已授權的重新導向 URI」白名單
 *   3. 使用者本人在 Google 登入時授權
 */

export const GOOGLE_CONFIG = {
  clientId:
    '589925898611-rejohvq9bsnijrloq9n53v36qes8i1pf.apps.googleusercontent.com',

  /**
   * Client Secret（Google「Web 應用程式」OAuth 用戶端要求的）。
   *
   * 雖然名字叫 "Secret"，但純前端 App 的 secret 本來就不是真正的祕密
   * （任何人開 DevTools 都能看到）。對個人 App 來說這沒安全問題，因為：
   *   - PKCE 已經提供攻擊防禦
   *   - 真正的安全是靠使用者在 Google 登入時的授權
   *   - redirect URI 白名單只有您的 localhost 和未來部署網址
   *
   * 從 Google Cloud Console → 憑證 → 您的 OAuth 2.0 用戶端 ID → Client Secret 複製貼上。
   */
  clientSecret: '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',

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

/** OAuth 流程要把使用者導去哪、登入完要導回哪 */
export const OAUTH_ENDPOINTS = {
  authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
  token: 'https://oauth2.googleapis.com/token',
} as const

/** 動態取得本地 redirect URI（dev 是 localhost，正式機是 GitHub Pages） */
export function getRedirectUri(): string {
  // 取「協議 + 主機 + 路徑（不含 hash 和 query）」
  const { origin, pathname } = window.location
  return origin + pathname
}
