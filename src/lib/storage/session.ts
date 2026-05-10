/**
 * 持久化登入狀態：refresh_token 存在 localStorage。
 * access_token 不持久化（活在記憶體裡，啟動時用 refresh_token 換新的）。
 */

const KEY = 'fm.session.v1'

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
}
