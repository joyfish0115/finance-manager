import { useEffect, useRef } from 'react'
import { handleAuthCallback } from '@/lib/google/auth'
import { useAuthStore } from '@/stores/useAuthStore'

/**
 * App 啟動時跑一次：
 *   1. 如果是從 Google OAuth 導回（URL 有 ?code=），跟後端交換 token
 *   2. 否則用 localStorage 裡的 refresh_token 換新 access_token
 */
export function useBootstrap(): void {
  const initRan = useRef(false)

  useEffect(() => {
    if (initRan.current) return
    initRan.current = true

    ;(async () => {
      try {
        const tokens = await handleAuthCallback()
        if (tokens) {
          useAuthStore.getState().setSignedIn(tokens)
          return
        }
        await useAuthStore.getState().hydrate()
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('登入初始化失敗', err)
        useAuthStore.setState({
          status: 'unauthenticated',
          authError: msg,
        })
      }
    })()
  }, [])
}
