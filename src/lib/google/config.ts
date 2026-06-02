/**
 * Google OAuth + API 設定。
 *
 * 流程：OAuth 2.0 Authorization Code Flow + PKCE
 *   - 前端產生 verifier，導去 Google
 *   - Google 把 code 回拋給前端
 *   - 前端把 code 交給 /api/oauth/exchange（Vercel Edge Function），
 *     由 server-side 用 client_secret 跟 Google 換 access/refresh token
 *   - Client secret 只存在 Vercel 環境變數，前端永遠看不到
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

/** OAuth endpoints */
export const OAUTH_ENDPOINTS = {
  /** Google 授權頁（讓使用者同意授權） */
  authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
  /** 自家後端（Vercel Edge Function），交換 authorization code → tokens */
  exchange: '/api/oauth/exchange',
  /** 自家後端，用 refresh token 換新 access token */
  refresh: '/api/oauth/refresh',
} as const

/**
 * 動態取得 redirect URI（dev 是 localhost，正式機是 Vercel）。
 * Google 會比對這個值跟 Authorized redirect URIs 白名單，必須完全一致。
 *
 * 用 origin + '/'（不含 hash / query）避免 HashRouter 把 #/path 也算進去。
 */
export function getRedirectUri(): string {
  return window.location.origin + '/'
}
