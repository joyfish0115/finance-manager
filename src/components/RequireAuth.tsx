import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { FullPageLoading } from './FullPageLoading'

/**
 * 守門人：根據登入狀態決定是要導去 /welcome、顯示載入中、或放行進主 App。
 */
export function RequireAuth() {
  const status = useAuthStore((s) => s.status)
  const { pathname } = useLocation()

  // App 剛啟動，還在判斷登入狀態
  if (status === 'unknown') {
    return <FullPageLoading />
  }

  // 未登入
  if (status === 'unauthenticated') {
    if (pathname === '/welcome') return <Outlet />
    return <Navigate to="/welcome" replace />
  }

  // 已登入，從 /welcome 跳回首頁
  if (pathname === '/welcome') return <Navigate to="/" replace />

  return <Outlet />
}
