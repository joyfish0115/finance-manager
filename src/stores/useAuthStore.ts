import { create } from 'zustand'
import {
  isTokenExpired,
  revokeToken,
  signIn as gisSignIn,
  silentRefresh,
  type TokenSet,
} from '@/lib/google/auth'
import {
  clearSession,
  hasSignedInBefore,
  markSignedIn,
} from '@/lib/storage/session'

type AuthStatus =
  | 'unknown' // 還在判斷中（App 剛啟動、靜默續期中）
  | 'unauthenticated'
  | 'authenticated'

interface AuthState {
  status: AuthStatus
  tokens: TokenSet | null
  /** 登入流程中發生的錯誤訊息（顯示給使用者看） */
  authError: string | null

  /** 使用者按「登入」按鈕：彈出 Google 同意視窗 */
  signIn: () => Promise<void>
  /** 設定錯誤訊息 */
  setAuthError: (msg: string | null) => void
  /** 取得有效的 access_token；過期會自動靜默續期 */
  getValidAccessToken: () => Promise<string>
  /** App 啟動時呼叫：如果以前登入過，嘗試靜默拿新 token */
  hydrate: () => Promise<void>
  /** 登出：撤銷 token 並清掉本地狀態 */
  signOut: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'unknown',
  tokens: null,
  authError: null,

  signIn: async () => {
    try {
      const tokens = await gisSignIn()
      markSignedIn()
      set({ status: 'authenticated', tokens, authError: null })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      set({ status: 'unauthenticated', tokens: null, authError: msg })
      throw err
    }
  },

  setAuthError: (msg) => set({ authError: msg }),

  getValidAccessToken: async () => {
    const { tokens } = get()
    if (tokens && !isTokenExpired(tokens)) return tokens.accessToken

    // 過期了，靜默拿新的
    try {
      const fresh = await silentRefresh()
      markSignedIn()
      set({ status: 'authenticated', tokens: fresh })
      return fresh.accessToken
    } catch (err) {
      // 靜默失敗（使用者撤銷授權、登出 Google 等）→ 回到未登入
      clearSession()
      set({
        status: 'unauthenticated',
        tokens: null,
        authError: err instanceof Error ? err.message : String(err),
      })
      throw new Error('登入已過期，請重新登入')
    }
  },

  hydrate: async () => {
    if (!hasSignedInBefore()) {
      set({ status: 'unauthenticated' })
      return
    }
    try {
      const tokens = await silentRefresh()
      markSignedIn()
      set({ status: 'authenticated', tokens })
    } catch (err) {
      // 靜默續期失敗 → 顯示登入畫面（不算錯誤，可能就是隔了很久要重新授權）
      console.info('靜默續期失敗，需要使用者重新登入', err)
      clearSession()
      set({ status: 'unauthenticated', tokens: null })
    }
  },

  signOut: () => {
    const { tokens } = get()
    if (tokens) revokeToken(tokens.accessToken)
    clearSession()
    set({ status: 'unauthenticated', tokens: null })
  },
}))
