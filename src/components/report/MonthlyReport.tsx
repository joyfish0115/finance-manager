import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { format, addMonths, subMonths } from 'date-fns'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { formatCurrency } from '@/lib/format'
import { getCategoryIcon } from '@/lib/categoryIcons'
import { useTransactions } from '@/hooks/useTransactions'

/** 圓餅圖配色（深色背景下可讀，繞回循環使用） */
const CHART_COLORS = [
  '#9b87ff', // brand-400 紫
  '#34d399', // 綠
  '#fbbf24', // 琥珀
  '#60a5fa', // 藍
  '#f472b6', // 粉
  '#2dd4bf', // 青
  '#fb923c', // 橘
  '#a78bfa', // 淺紫
  '#f87171', // 紅
  '#94a3b8', // 灰（給「其他」）
]

export function MonthlyReport() {
  const { data: transactions, isLoading } = useTransactions()
  const [cursor, setCursor] = useState(() => new Date())

  const monthKey = format(cursor, 'yyyy-MM')
  const monthLabel = format(cursor, 'yyyy 年 M 月')
  const isCurrentMonth =
    format(cursor, 'yyyy-MM') === format(new Date(), 'yyyy-MM')

  // 該月份的交易
  const monthlyTx = useMemo(
    () => (transactions ?? []).filter((t) => t.date.startsWith(monthKey)),
    [transactions, monthKey],
  )

  // 收入 / 支出總計
  const income = monthlyTx
    .filter((t) => t.kind === '收入')
    .reduce((s, t) => s + t.amount, 0)
  const expense = monthlyTx
    .filter((t) => t.kind === '支出')
    .reduce((s, t) => s + t.amount, 0)
  const balance = income - expense

  // 分類聚合（只看支出）
  const categoryStats = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>()
    monthlyTx
      .filter((t) => t.kind === '支出')
      .forEach((t) => {
        const prev = map.get(t.category) ?? { total: 0, count: 0 }
        map.set(t.category, {
          total: prev.total + t.amount,
          count: prev.count + 1,
        })
      })
    return Array.from(map.entries())
      .map(([category, v]) => ({
        category,
        total: v.total,
        count: v.count,
        percent: expense > 0 ? (v.total / expense) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)
  }, [monthlyTx, expense])

  return (
    <div className="px-5 md:px-8 py-6 space-y-6">
      {/* ── 月份切換器 ── */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setCursor((d) => subMonths(d, 1))}
          aria-label="上個月"
          className="p-2 rounded-lg text-ink-mid hover:text-ink-high hover:bg-surface-2 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-base font-medium text-ink-high min-w-[8rem] text-center">
          {monthLabel}
        </div>
        <button
          onClick={() => setCursor((d) => addMonths(d, 1))}
          disabled={isCurrentMonth}
          aria-label="下個月"
          className="p-2 rounded-lg text-ink-mid hover:text-ink-high hover:bg-surface-2 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-mid"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 text-ink-mid py-12">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">載入中…</span>
        </div>
      ) : (
        <>
          {/* ── 三張摘要卡片 ── */}
          <div className="grid grid-cols-3 gap-3">
            <SummaryCard label="收入" value={formatCurrency(income)} tone="positive" />
            <SummaryCard label="支出" value={formatCurrency(expense)} tone="negative" />
            <SummaryCard
              label="結餘"
              value={formatCurrency(balance)}
              tone={balance >= 0 ? 'positive' : 'negative'}
              accent
            />
          </div>

          {/* ── 圓餅圖 + 分類列表 ── */}
          <div className="grid gap-6 md:grid-cols-2">
            <Panel title="支出分類佔比">
              {categoryStats.length === 0 ? (
                <EmptyHint text="本月還沒有支出記錄" />
              ) : (
                <CategoryPie data={categoryStats} total={expense} />
              )}
            </Panel>

            <Panel title="分類明細">
              {categoryStats.length === 0 ? (
                <EmptyHint text="本月還沒有支出記錄" />
              ) : (
                <ul className="space-y-3">
                  {categoryStats.map((c, i) => (
                    <CategoryRow
                      key={c.category}
                      category={c.category}
                      total={c.total}
                      count={c.count}
                      percent={c.percent}
                      color={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}

// ─── 圓餅圖 ────────────────────────────────────────────────────────────────

interface PieData {
  category: string
  total: number
  count: number
  percent: number
}

function CategoryPie({ data, total }: { data: PieData[]; total: number }) {
  return (
    <div className="relative h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#1f2028',
              border: '1px solid #2e303a',
              borderRadius: 8,
              fontSize: 13,
            }}
            labelStyle={{ color: '#f3f4f6' }}
            itemStyle={{ color: '#f3f4f6' }}
            formatter={(value) => formatCurrency(Number(value))}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* 中心顯示總額 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xs text-ink-low">總支出</span>
        <span className="font-mono text-lg text-ink-high tabular-nums mt-0.5">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  )
}

// ─── 分類列 ────────────────────────────────────────────────────────────────

function CategoryRow({
  category,
  total,
  count,
  percent,
  color,
}: {
  category: string
  total: number
  count: number
  percent: number
  color: string
}) {
  const iconName = getCategoryIcon(category)
  return (
    <li className="flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}22`, color }}
      >
        <MaterialIcon name={iconName} size={18} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-ink-high truncate">{category}</span>
          <span className="font-mono text-sm text-ink-high tabular-nums shrink-0">
            {formatCurrency(total)}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2 mt-0.5">
          <span className="text-xs text-ink-low">{count} 筆</span>
          <span className="font-mono text-xs text-ink-low tabular-nums">
            {percent.toFixed(1)}%
          </span>
        </div>
      </div>
    </li>
  )
}

// ─── 共用元件 ────────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  tone,
  accent,
}: {
  label: string
  value: string
  tone?: 'positive' | 'negative'
  accent?: boolean
}) {
  const toneColor =
    tone === 'positive'
      ? 'text-positive'
      : tone === 'negative'
        ? 'text-negative'
        : 'text-ink-high'

  return (
    <div
      className={`rounded-xl border bg-surface-1 p-4 ${
        accent ? 'border-brand-500/30' : 'border-surface-border'
      }`}
    >
      <div className="text-[11px] uppercase tracking-wider text-ink-low">{label}</div>
      <div className={`mt-1.5 font-mono text-lg tabular-nums ${toneColor}`}>{value}</div>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-1 p-5">
      <h2 className="text-base font-medium mb-4">{title}</h2>
      {children}
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-sm text-ink-mid py-8 text-center">{text}</p>
}
