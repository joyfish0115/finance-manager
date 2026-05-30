import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'

/**
 * App 啟動時跑一次：
 * 如果使用者以前登入過，嘗試靜默向 Google 拿新 access_token；
 * 否則直接顯示登入畫面。
 */
export function useBootstrap(): void {
  const initRan = useRef(false)

  useEffect(() => {
    if (initRan.current) return
    initRan.current = true

    void useAuthStore.getState().hydrate()
  }, [])
}
