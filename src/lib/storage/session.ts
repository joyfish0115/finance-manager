/**
 * 持久化登入「狀態」（不是 token）。
 *
 * 改用 GIS Token Model 後，前端拿不到 refresh_token，也沒有東西好存。
 * 我們只記一個旗標：「使用者曾經同意過授權」，
 * App 啟動時看到這個旗標就嘗試靜默續期；沒有就顯示登入畫面。
 */

const KEY = 'fm.session.v2'

interface PersistedSession {
  /** 使用者上次成功登入的時間（UNIX 秒），目前僅做除錯用 */
  signedInAt: number
}

export function hasSignedInBefore(): boolean {
  return localStorage.getItem(KEY) !== null
}

export function markSignedIn(): void {
  const session: PersistedSession = { signedInAt: Math.floor(Date.now() / 1000) }
  localStorage.setItem(KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(KEY)
  // 順手把舊版（v1，存了 refresh_token）也清掉
  localStorage.removeItem('fm.session.v1')
}
