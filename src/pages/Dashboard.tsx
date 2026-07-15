import { Link } from 'react-router-dom'
import { Settings as SettingsIcon, Loader2, Eye, EyeOff } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { SyncReminder } from '@/components/SyncReminder'
import { formatCurrency, formatCurrencyMaybeHidden } from '@/lib/format'
import { useAccounts } from '@/hooks/useAccounts'
import { useRecurring } from '@/hooks/useRecurring'
import { usePrivacyStore } from '@/stores/usePrivacyStore'

export function Dashboard() {
  return (
    <>
      <PageHeader
        title="總覽"
        subtitle="快速掌握目前財務狀況"
        actions={
          <Link
            to="/settings"
            aria-label="設定"
            className="p-2 -mr-2 rounded-lg text-ink-mid hover:text-ink-high hover:bg-surface-2 transition-colors"
          >
            <SettingsIcon size={20} />
          </Link>
        }
      />

      <SyncReminder />

      <OverviewView />
    </>
  )
}

// ─── 概覽 ───────────────────────────────────────────────────────────────────

function OverviewView() {
  const { data: accounts, isLoading: accountsLoading } = useAccounts()
  const { data: recurring, isLoading: recurringLoading } = useRecurring()
  const hidden = usePrivacyStore((s) => s.hidden)
  const togglePrivacy = usePrivacyStore((s) => s.toggle)

  const total = accounts?.reduce((sum, a) => sum + a.balance, 0) ?? 0

  // 本月固定支出（只算「固定支出」類型，「投資」不計入）
  const monthlyFixed =
    recurring?.filter((r) => r.kind === '固定支出').reduce((s, r) => s + r.amount, 0) ?? 0

  // 本月即將扣款：扣款日 >= 今天的日期
  const today = new Date().getDate()
  const upcoming = (recurring ?? [])
    .filter((r) => r.dayOfMonth >= today)
    .sort((a, b) => a.dayOfMonth - b.dayOfMonth)
    .slice(0, 5) // 只顯示前 5 筆

  return (
    <>
      {/* 兩張摘要卡片 */}
      <div className="px-5 md:px-8 py-6 grid gap-4 md:grid-cols-2">
        <SummaryCard
          label="總資產"
          value={accountsLoading ? '—' : formatCurrencyMaybeHidden(total, hidden)}
          accent
          loading={accountsLoading}
          action={
            <button
              type="button"
              onClick={togglePrivacy}
              aria-label={hidden ? '顯示金額' : '隱藏金額'}
              title={hidden ? '顯示金額' : '隱藏金額'}
              className="p-1 -m-1 rounded text-ink-low hover:text-ink-high transition-colors"
            >
              {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
        <SummaryCard
          label="本月固定支出"
          value={recurringLoading ? '—' : formatCurrency(monthlyFixed)}
          loading={recurringLoading}
        />
      </div>

      {/* 帳戶總覽 + 即將扣款 */}
      <section className="px-5 md:px-8 pb-10 grid gap-6 md:grid-cols-2">
        {/* 帳戶列表 */}
        <Panel title="帳戶總覽">
          {accountsLoading ? (
            <div className="flex items-center gap-2 text-ink-mid py-2">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-xs">載入中…</span>
            </div>
          ) : accounts && accounts.length > 0 ? (
            <ul className="space-y-4">
              {accounts.map((acc) => (
                <li key={acc.id} className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-base text-ink-high truncate leading-tight">
                      {acc.bank}
                    </div>
                    {/* 用 min-h 保留固定空間，沒有暱稱時也維持兩行高度 */}
                    <div className="text-sm text-ink-low truncate leading-tight min-h-[1.25rem] mt-0.5">
                      {acc.name || ' '}
                    </div>
                  </div>
                  <span className="font-mono text-base text-ink-high tabular-nums shrink-0 leading-tight">
                    {formatCurrencyMaybeHidden(acc.balance, hidden)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-mid">
              尚未新增帳戶。{' '}
              <Link to="/accounts" className="text-brand-300 hover:underline">
                前往新增
              </Link>
            </p>
          )}
        </Panel>

        {/* 即將扣款 */}
        <Panel title="本月即將扣款">
          {recurringLoading ? (
            <div className="flex items-center gap-2 text-ink-mid py-2">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-xs">載入中…</span>
            </div>
          ) : upcoming.length > 0 ? (
            <ul className="space-y-4">
              {upcoming.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-sm text-ink-low w-8 shrink-0">
                      {r.dayOfMonth}號
                    </span>
                    <span className="text-base text-ink-high truncate">{r.name}</span>
                  </div>
                  <span className="font-mono text-base text-ink-high tabular-nums shrink-0">
                    {formatCurrency(r.amount)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-mid">
              本月已無待扣款項目。{' '}
              <Link to="/recurring" className="text-brand-300 hover:underline">
                管理固定金流
              </Link>
            </p>
          )}
        </Panel>
      </section>
    </>
  )
}

// ─── 共用元件 ────────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  accent,
  loading,
  action,
}: {
  label: string
  value: string
  accent?: boolean
  loading?: boolean
  /** 卡片右上角的操作元素（例如隱藏金額的眼睛按鈕） */
  action?: React.ReactNode
}) {
  return (
    <div
      className={`rounded-xl border bg-surface-1 p-5 ${
        accent ? 'border-brand-500/30' : 'border-surface-border'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs uppercase tracking-wider text-ink-low">{label}</div>
        {action}
      </div>
      <div
        className={`mt-2 font-mono text-2xl tabular-nums ${
          loading ? 'text-ink-low' : accent ? 'text-brand-300' : 'text-ink-high'
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-1 p-5">
      <h2 className="text-lg font-medium mb-4">{title}</h2>
      {children}
    </div>
  )
}
