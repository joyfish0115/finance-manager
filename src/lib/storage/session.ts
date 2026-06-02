/**
 * 持久化登入狀態：refresh_token 存在 localStorage。
 * access_token 不持久化（活在記憶體裡，啟動時用 refresh_token 換新的）。
 *
 * refresh_token 對使用者來說是「長期身分證」，落在 localStorage 也只有
 * 同個瀏覽器 / 同個使用者的 App 程式碼能讀到，安全模型可接受。
 */

const KEY = 'fm.session.v3'

export interface PersistedSession {
  refreshToken: string
}

export function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedSession>
    if (!parsed.refreshToken) return null
    return parsed as PersistedSession
  } catch {
    return null
  }
}

export function saveSession(session: PersistedSession): void {
  localStorage.setItem(KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(KEY)
  // 順手把舊版（v1 = PKCE+secret、v2 = GIS 旗標）也清掉
  localStorage.removeItem('fm.session.v1')
  localStorage.removeItem('fm.session.v2')
}
