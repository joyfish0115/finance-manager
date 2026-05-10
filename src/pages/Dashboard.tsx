import { Link, useLocation } from 'react-router-dom'
import { Settings as SettingsIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { PageHeader } from '@/components/PageHeader'
import { SubTabs } from '@/components/SubTabs'
import { formatCurrency } from '@/lib/format'
import { useAccounts } from '@/hooks/useAccounts'
import { useTransactions } from '@/hooks/useTransactions'
import { useRecurring } from '@/hooks/useRecurring'

const TABS = [
  { to: '/', label: '概覽', end: true },
  { to: '/report', label: '月報' },
]

export function Dashboard() {
  const { pathname } = useLocation()
  const isReport = pathname === '/report'

  return (
    <>
      <PageHeader
        title="總覽"
        subtitle={isReport ? '本月收支與分類統計' : '快速掌握目前財務狀況'}
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

      <SubTabs tabs={TABS} />

      {isReport ? <ReportView /> : <OverviewView />}
    </>
  )
}

// ─── 概覽 ───────────────────────────────────────────────────────────────────

function OverviewView() {
  const { data: accounts, isLoading: accountsLoading } = useAccounts()
  const { data: transactions, isLoading: txLoading } = useTransactions()
  const { data: recurring, isLoading: recurringLoading } = useRecurring()

  const total = accounts?.reduce((sum, a) => sum + a.balance, 0) ?? 0
  const monthKey = format(new Date(), 'yyyy-MM')
  const monthlyExpense =
    transactions
      ?.filter((t) => t.kind === '支出' && t.date.startsWith(monthKey))
      .reduce((s, t) => s + t.amount, 0) ?? 0

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
      {/* 三張摘要卡片 */}
      <div className="px-5 md:px-8 py-6 grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="總資產"
          value={accountsLoading ? '—' : formatCurrency(total)}
          accent
          loading={accountsLoading}
        />
        <SummaryCard
          label="本月固定支出"
          value={recurringLoading ? '—' : formatCurrency(monthlyFixed)}
          loading={recurringLoading}
        />
        <SummaryCard
          label="本月記帳支出"
          value={txLoading ? '—' : formatCurrency(monthlyExpense)}
          loading={txLoading}
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
            <ul className="space-y-2.5">
              {accounts.map((acc) => (
                <li key={acc.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-sm text-ink-high truncate block">{acc.bank}</span>
                    {acc.name && (
                      <span className="text-xs text-ink-low truncate block">{acc.name}</span>
                    )}
                  </div>
                  <span className="font-mono text-sm text-ink-high tabular-nums shrink-0">
                    {formatCurrency(acc.balance)}
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
            <ul className="space-y-2.5">
              {upcoming.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-ink-low w-7 shrink-0">
                      {r.dayOfMonth}號
                    </span>
                    <span className="text-sm text-ink-high truncate">{r.name}</span>
                  </div>
                  <span className="font-mono text-sm text-ink-high tabular-nums shrink-0">
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

// ─── 月報 ───────────────────────────────────────────────────────────────────

function ReportView() {
  return (
    <div className="px-5 md:px-8 py-6 grid gap-4 md:grid-cols-3">
      <SummaryCard label="收入總計" value={formatCurrency(0)} />
      <SummaryCard label="支出總計" value={formatCurrency(0)} />
      <SummaryCard label="收支結餘" value={formatCurrency(0)} accent />
      <div className="md:col-span-3">
        <Panel title="支出分類">
          <p className="text-sm text-ink-mid">圓餅圖（待開發）</p>
        </Panel>
      </div>
    </div>
  )
}

// ─── 共用元件 ────────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  accent,
  loading,
}: {
  label: string
  value: string
  accent?: boolean
  loading?: boolean
}) {
  return (
    <div
      className={`rounded-xl border bg-surface-1 p-5 ${
        accent ? 'border-brand-500/30' : 'border-surface-border'
      }`}
    >
      <div className="text-xs uppercase tracking-wider text-ink-low">{label}</div>
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
      <h2 className="text-base font-medium mb-3">{title}</h2>
      {children}
    </div>
  )
}
