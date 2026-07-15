import { matchPath, NavLink, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Wallet } from 'lucide-react'
import type { ComponentType } from 'react'

interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ size?: number }>
  /** 哪些 path 也算這個 tab 是 active 的（例如 /settings 也算屬於「總覽」這個 tab） */
  alsoActiveOn?: string[]
}

const NAV: NavItem[] = [
  {
    to: '/report',
    label: '總覽',
    icon: LayoutDashboard,
    alsoActiveOn: ['/settings'],
  },
  { to: '/accounts', label: '帳戶', icon: Wallet, alsoActiveOn: ['/recurring'] },
]

function useTabActive(item: NavItem) {
  const { pathname } = useLocation()
  if (matchPath({ path: item.to, end: false }, pathname)) return true
  return item.alsoActiveOn?.some((p) => matchPath({ path: p, end: false }, pathname)) ?? false
}

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* 桌面側邊欄 */}
      <aside className="hidden md:flex md:w-56 md:flex-col border-r border-surface-border bg-surface-1">
        <div className="px-5 py-6">
          <h1 className="text-lg font-semibold text-ink-high">財務管理</h1>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map((item) => (
            <DesktopNavItem key={item.to} item={item} />
          ))}
        </nav>
      </aside>

      {/* 主內容 */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* 手機底部 tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-surface-border bg-surface-1/95 backdrop-blur safe-bottom">
        <div className="grid grid-cols-2">
          {NAV.map((item) => (
            <MobileNavItem key={item.to} item={item} />
          ))}
        </div>
      </nav>
    </div>
  )
}

function DesktopNavItem({ item }: { item: NavItem }) {
  const isActive = useTabActive(item)
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        isActive
          ? 'bg-brand-500/15 text-brand-300'
          : 'text-ink-mid hover:text-ink-high hover:bg-surface-2'
      }`}
    >
      <Icon size={18} />
      {item.label}
    </NavLink>
  )
}

function MobileNavItem({ item }: { item: NavItem }) {
  const isActive = useTabActive(item)
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${
        isActive ? 'text-brand-300' : 'text-ink-low'
      }`}
    >
      <Icon size={22} />
      {item.label}
    </NavLink>
  )
}
