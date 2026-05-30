import { Plus, Loader2, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { TransactionItem } from '@/components/transactions/TransactionItem'
import { useTransactions, useDeleteTransaction, groupByDate } from '@/hooks/useTransactions'
import { formatCurrency } from '@/lib/format'

const WEEK_DAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function formatDateHeader(dateStr: string): string {
  try {
    const date = parseISO(dateStr)
    return `${format(date, 'MM/dd')} ${WEEK_DAYS[date.getDay()]}`
  } catch {
    return dateStr
  }
}

export function Transactions() {
  const navigate = useNavigate()
  const { data: transactions, isLoading, error } = useTransactions()
  const deleteMut = useDeleteTransaction()

  const openAdd = () => navigate('/transactions/new')

  const monthKey = format(new Date(), 'yyyy-MM')
  const monthlyExpense =
    transactions
      ?.filter((t) => t.kind === '支出' && t.date.startsWith(monthKey))
      .reduce((s, t) => s + t.amount, 0) ?? 0

  const groups = groupByDate(transactions ?? [])

  return (
    <>
      <PageHeader
        title="記帳"
        subtitle={`本月支出 ${formatCurrency(monthlyExpense)}`}
        actions={
          /* 桌面版：標題右側的新增按鈕 */
          <button
            type="button"
            onClick={() => openAdd()}
            className="hidden md:flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-400 transition-colors"
          >
            <Plus size={15} />
            新增
          </button>
        }
      />

      <div className="px-5 md:px-8 py-6 max-w-2xl space-y-4">
        {/* 載入中 */}
        {isLoading && (
          <div className="flex items-center gap-2 text-ink-mid py-4">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">載入記帳資料…</span>
          </div>
        )}

        {/* 錯誤 */}
        {error && (
          <div className="flex gap-2.5 rounded-xl border border-negative/40 bg-negative/10 p-4">
            <AlertCircle size={18} className="text-negative shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-ink-high">載入失敗</div>
              <div className="text-xs text-ink-mid mt-1 break-words">{String(error)}</div>
            </div>
          </div>
        )}

        {/* 空狀態 */}
        {!isLoading && !error && transactions?.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center text-ink-mid">
            <p className="text-base mb-6">還沒有記帳紀錄</p>
            <Button onClick={() => openAdd()}>
              <Plus size={16} />
              新增第一筆
            </Button>
          </div>
        )}

        {/* 日期分組卡片 */}
        {groups.map(({ date, items }) => {
          const dayExpense = items
            .filter((t) => t.kind === '支出')
            .reduce((s, t) => s + t.amount, 0)
          const dayIncome = items
            .filter((t) => t.kind === '收入')
            .reduce((s, t) => s + t.amount, 0)

          // 當天淨額：收入 - 支出
          const net = dayIncome - dayExpense

          return (
            <section
              key={date}
              className="rounded-2xl border border-surface-border bg-surface-1 overflow-hidden"
            >
              {/* 日期列標題 */}
              <div className="flex items-baseline justify-between px-5 py-4 border-b border-surface-border">
                <h2 className="text-base font-semibold text-ink-high">
                  {formatDateHeader(date)}
                </h2>
                <span className="font-mono text-base font-medium text-brand-300 tabular-nums">
                  {net >= 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(net))}
                </span>
              </div>

              {/* 當天記帳列 */}
              <div className="divide-y divide-surface-border/40">
                {items.map((t) => (
                  <TransactionItem
                    key={t.id}
                    transaction={t}
                    onDelete={() => deleteMut.mutate(t.id)}
                    isDeleting={deleteMut.isPending}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* 手機 FAB — 固定在底部導覽列上方 */}
      <button
        type="button"
        onClick={() => openAdd()}
        className="md:hidden fixed bottom-[76px] right-5 z-30 w-14 h-14 rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/30 hover:bg-brand-400 active:bg-brand-600 flex items-center justify-center transition-colors"
        aria-label="新增記帳"
      >
        <Plus size={26} />
      </button>

    </>
  )
}
