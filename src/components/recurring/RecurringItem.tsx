import { useState } from 'react'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { formatCurrency, formatPercent } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import type { RecurringWithRow } from '@/lib/google/recurringApi'
import type { AccountWithRow } from '@/lib/google/accountsApi'

interface Props {
  recurring: RecurringWithRow
  accounts: AccountWithRow[]
  onEdit: () => void
  onDelete: () => void
  isDeleting?: boolean
}

/** 把 accountId 對應到顯示用的「銀行・暱稱」字串 */
function formatAccount(accounts: AccountWithRow[], accountId: string): string {
  const acc = accounts.find((a) => a.id === accountId)
  if (!acc) return '（找不到帳戶）'
  return acc.name ? `${acc.bank}・${acc.name}` : acc.bank
}

export function RecurringItem({
  recurring,
  accounts,
  onEdit,
  onDelete,
  isDeleting,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isInvest = recurring.kind === '投資'

  // ── 確認刪除 ──────────────────────────────────────────────────────────────
  if (confirmDelete) {
    return (
      <div className="rounded-xl border border-negative/40 bg-negative/10 p-5 space-y-3">
        <p className="text-sm font-medium text-ink-high">
          確定刪除「{recurring.name}」？
        </p>
        <div className="flex gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="flex-1"
            onClick={() => setConfirmDelete(false)}
            disabled={isDeleting}
          >
            取消
          </Button>
          <button
            type="button"
            className="flex-1 rounded-lg py-2 text-sm font-medium bg-negative/20 text-negative hover:bg-negative/30 transition-colors disabled:opacity-50"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? '刪除中…' : '確認刪除'}
          </button>
        </div>
      </div>
    )
  }

  // ── 正常卡片 ───────────────────────────────────────────────────────────────
  return (
    <div className="relative rounded-xl border border-surface-border bg-surface-1 px-5 py-4">
      {/* 上排：名稱 + 金額 */}
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-medium text-ink-high truncate">{recurring.name}</h3>
        <span className="font-mono text-base font-medium text-ink-high tabular-nums shrink-0">
          {formatCurrency(recurring.amount)}
        </span>
      </div>

      {/* 第二排：類型 / 帳戶 / 扣款日 */}
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-ink-mid">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`px-2 py-0.5 rounded-full font-medium shrink-0 ${
              isInvest
                ? 'text-brand-300 bg-brand-500/15'
                : 'text-amber-400 bg-amber-400/10'
            }`}
          >
            {recurring.kind}
          </span>
          <span className="truncate">{formatAccount(accounts, recurring.accountId)}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-ink-low">每月 {recurring.dayOfMonth} 號</span>

          <button
            type="button"
            aria-label="更多選項"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
            className="p-1 -mr-1 rounded-lg text-ink-low hover:text-ink-high hover:bg-surface-2 transition-colors"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* 投資專屬：持有總值 + 報酬率 */}
      {isInvest && (recurring.holdingValue !== undefined || recurring.returnRate !== undefined) && (
        <div className="mt-3 pt-3 border-t border-surface-border grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-ink-low">持有總值</div>
            <div className="font-mono text-sm text-ink-high tabular-nums mt-0.5">
              {recurring.holdingValue !== undefined
                ? formatCurrency(recurring.holdingValue)
                : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-ink-low">報酬率</div>
            <div
              className={`font-mono text-sm tabular-nums mt-0.5 ${
                recurring.returnRate === undefined
                  ? 'text-ink-mid'
                  : recurring.returnRate >= 0
                    ? 'text-positive'
                    : 'text-negative'
              }`}
            >
              {recurring.returnRate !== undefined
                ? `${recurring.returnRate >= 0 ? '+' : ''}${formatPercent(recurring.returnRate)}`
                : '—'}
            </div>
          </div>
        </div>
      )}

      {/* 下拉選單 */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(false)
            }}
          />
          <div className="absolute right-3 top-12 z-20 min-w-[120px] rounded-xl border border-surface-border bg-surface-2 shadow-xl py-1 overflow-hidden">
            <button
              type="button"
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-ink-mid hover:text-ink-high hover:bg-surface-3 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(false)
                onEdit()
              }}
            >
              <Pencil size={14} />
              編輯
            </button>
            <button
              type="button"
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-negative hover:bg-negative/10 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(false)
                setConfirmDelete(true)
              }}
            >
              <Trash2 size={14} />
              刪除
            </button>
          </div>
        </>
      )}
    </div>
  )
}
