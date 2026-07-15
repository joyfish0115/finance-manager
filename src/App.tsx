import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { RequireAuth } from '@/components/RequireAuth'
import { Dashboard } from '@/pages/Dashboard'
import { Accounts } from '@/pages/Accounts'
import { BigExpenses } from '@/pages/BigExpenses'
import { SettingsPage } from '@/pages/Settings'
import { Welcome } from '@/pages/Welcome'
import { useBootstrap } from '@/hooks/useBootstrap'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

// 用 hash router 是為了部署到 GitHub Pages 不需要伺服器端 rewrite。
// OAuth callback 的 ?code= 會出現在 query string，跟 hash 各自獨立，不衝突。
const router = createHashRouter([
  {
    element: <RequireAuth />,
    children: [
      { path: '/welcome', element: <Welcome /> },
      {
        path: '/',
        element: <AppLayout />,
        children: [
          // 預設頁：直接跳到總覽
          { index: true, element: <Navigate to="/report" replace /> },
          // 「總覽」tab
          { path: 'report', element: <Dashboard /> },
          // 「帳戶」tab：帳戶餘額 + 固定金流
          { path: 'accounts', element: <Accounts /> },
          { path: 'recurring', element: <Accounts /> },
          // 「大額消費」tab（記帳完整功能已隱藏，見 Transactions.tsx / TransactionForm.tsx）
          { path: 'big-expenses', element: <BigExpenses /> },
          // 設定（從總覽右上角齒輪進入）
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
])

function App() {
  useBootstrap()
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

export default App
