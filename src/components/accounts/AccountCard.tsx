import { useState } from 'react'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { formatCurrencyMaybeHidden } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { usePrivacyStore } from '@/stores/usePrivacyStore'
import type { Account } from '@/types'

const TYPE_COLORS: Record<string, string> = {
  活存: 'text-sky-400 bg-sky-400/10',
  定存: 'text-teal-400 bg-teal-400/10',
  證券戶: 'text-brand-300 bg-brand-500/15',
  基金帳戶: 'text-amber-400 bg-amber-400/10',
}

const TYPE_FILL: Record<string, string> = {
  活存: 'bg-sky-400',
  定存: 'bg-teal-400',
  證券戶: 'bg-brand-500',
  基金帳戶: 'bg-amber-400',
}

interface Props {
  account: Account
  /** 此帳戶佔總資產的百分比（0–100） */
  percentage: number
  /** 點卡片主體 → 快速更新餘額 */
  onEditBalance: () => void
  /** ⋮ 選單 → 編輯完整資料 */
  onEdit: () => void
  /** ⋮ 選單 → 刪除（呼叫後父層執行 mutation） */
  onDelete: () => void
  isDeleting?: boolean
}

export function AccountCard({
  account,
  percentage,
  onEditBalance,
  onEdit,
  onDelete,
  isDeleting,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const hidden = usePrivacyStore((s) => s.hidden)
  const typeColor = TYPE_COLORS[account.type] ?? 'text-ink-mid bg-surface-2'
  const fillColor = TYPE_FILL[account.type] ?? 'bg-ink-low'

  const pctClamped = Math.max(0, Math.min(100, percentage))
  const pctLabel =
    pctClamped === 0 ? '0%' : pctClamped < 1 ? '<1%' : `${Math.round(pctClamped)}%`

  // ── 確認刪除狀態 ──────────────────────────────────────────────────────────
  if (confirmDelete) {
    return (
      <div className="rounded-xl border border-negative/40 bg-negative/10 p-5 space-y-3">
        <p className="text-sm font-medium text-ink-high">
          確定要刪除「{account.bank}」？
        </p>
        <p className="text-xs text-ink-mid leading-relaxed">
          這個帳戶會在下次同步時從 Google Sheet 中移除，無法復原。
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

  // ── 正常卡片 ──────────────────────────────────────────────────────────────
  return (
    <div
      className="relative rounded-xl border border-surface-border bg-surface-1 px-5 py-4 cursor-pointer hover:border-brand-500/30 hover:bg-surface-2/50 transition-colors"
      onClick={onEditBalance}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onEditBalance()}
    >
      {/* 上排：銀行名稱 + 餘額（同一行對照） */}
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-medium text-ink-high truncate">
          {account.bank}
        </h3>
        <span className="font-mono text-lg font-medium text-ink-high tabular-nums shrink-0">
          {formatCurrencyMaybeHidden(account.balance, hidden)}
        </span>
      </div>

      {/* 下排：類型標籤 + 暱稱 + 佔比進度條 + ⋮ 選單 */}
      <div className="mt-2 flex items-center gap-2">
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${typeColor}`}
        >
          {account.type}
        </span>
        {account.name && (
          <span className="text-xs text-ink-mid truncate min-w-0">
            {account.name}
          </span>
        )}

        {/* 佔比：細進度條 + 百分比數字 */}
        <div
          className="ml-auto flex items-center gap-2 shrink-0"
          aria-label={`佔總資產 ${pctLabel}`}
        >
          <div className="w-12 h-1 bg-surface-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${fillColor}`}
              style={{ width: `${pctClamped}%` }}
            />
          </div>
          <span className="text-xs text-ink-mid tabular-nums w-9 text-right">
            {pctLabel}
          </span>
        </div>

        <button
          type="button"
          aria-label="更多選項"
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen((v) => !v)
          }}
          className="p-1 -mr-1 rounded-lg text-ink-low hover:text-ink-high hover:bg-surface-2 transition-colors shrink-0"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {/* 下拉選單 */}
      {menuOpen && (
        <>
          {/* 點外側關閉 */}
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(false)
            }}
          />
          <div className="absolute right-3 bottom-12 z-20 min-w-[120px] rounded-xl border border-surface-border bg-surface-2 shadow-xl py-1 overflow-hidden">
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
              編輯帳戶
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
              刪除帳戶
            </button>
          </div>
        </>
      )}
    </div>
  )
}
