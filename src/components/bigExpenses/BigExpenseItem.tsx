import { Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import type { Transaction } from '@/types'

interface Props {
  transaction: Transaction
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}

/** 「大額消費」列表列：只顯示備註（沒填就顯示分類）+ 金額，不強調分類圖示。 */
export function BigExpenseItem({ transaction, onEdit, onDelete, isDeleting }: Props) {
  const sign = transaction.kind === '支出' ? '-' : '+'

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!window.confirm('確定刪除這筆紀錄？此操作無法復原。')) return
    onDelete()
  }

  return (
    <div
      onClick={onEdit}
      className="group flex items-center gap-4 px-5 py-3.5 bg-surface-1 cursor-pointer hover:bg-surface-2 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="text-base text-ink-high truncate">
          {transaction.note || transaction.category}
        </div>
      </div>

      <span className="font-mono text-base text-ink-high tabular-nums shrink-0">
        {sign}
        {formatCurrency(transaction.amount)}
      </span>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        aria-label="刪除"
        className="p-1.5 -mr-1.5 rounded-lg text-ink-low/60 hover:text-negative hover:bg-negative/10 transition-colors disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}
