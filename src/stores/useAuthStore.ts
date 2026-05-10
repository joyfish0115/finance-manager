import { create } from 'zustand'
import {
  isTokenExpired,
  refreshAccessToken,
  type TokenSet,
} from '@/lib/google/auth'
import {
  clearSession,
  loadSession,
  saveSession,
  type PersistedSession,
} from '@/lib/storage/session'

type AuthStatus =
  | 'unknown' // 還在判斷中（剛開 App、refresh_token 換 access_token 中）
  | 'unauthenticated'
  | 'authenticated'

interface AuthState {
  status: AuthStatus
  tokens: TokenSet | null
  /** 登入流程中發生的錯誤訊息（顯示給使用者看） */
  authError: string | null

  /** 登入成功後（剛從 Google callback 回來）呼叫 */
  setSignedIn: (tokens: TokenSet) => void
  /** 設定錯誤訊息 */
  setAuthError: (msg: string | null) => void
  /** 取得有效的 access_token；過期會自動續期 */
  getValidAccessToken: () => Promise<string>
  /** 啟動時把 localStorage 的 refresh_token 拿出來換 access_token */
  hydrate: () => Promise<void>
  /** 登出：清空所有 token */
  signOut: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'unknown',
  tokens: null,
  authError: null,

  setSignedIn: (tokens) => {
    if (!tokens.refreshToken) {
      throw new Error('沒有拿到 refresh_token，無法保持登入狀態')
    }
    const session: PersistedSession = { refreshToken: tokens.refreshToken }
    saveSession(session)
    set({ status: 'authenticated', tokens, authError: null })
  },

  setAuthError: (msg) => set({ authError: msg }),

  getValidAccessToken: async () => {
    const { tokens } = get()
    if (tokens && !isTokenExpired(tokens)) return tokens.accessToken

    // 過期了，用 refresh_token 換
    const session = loadSession()
    if (!session) {
      set({ status: 'unauthenticated', tokens: null })
      throw new Error('尚未登入')
    }
    const fresh = await refreshAccessToken(session.refreshToken)
    set({ status: 'authenticated', tokens: fresh })
    return fresh.accessToken
  },

  hydrate: async () => {
    const session = loadSession()
    if (!session) {
      set({ status: 'unauthenticated' })
      return
    }
    try {
      const tokens = await refreshAccessToken(session.refreshToken)
      set({ status: 'authenticated', tokens })
    } catch (err) {
      // refresh_token 失效（撤銷、過期等）→ 清空、回到未登入
      console.warn('refresh_token 已失效，需重新登入', err)
      clearSession()
      set({ status: 'unauthenticated', tokens: null })
    }
  },

  signOut: () => {
    clearSession()
    set({ status: 'unauthenticated', tokens: null })
  },
}))
