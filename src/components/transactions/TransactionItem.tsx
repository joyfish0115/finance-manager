import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import type { TransactionWithRow } from '@/lib/google/transactionsApi'

/**
 * 各分類對應的 Material Symbol 名稱。
 * 名稱列表查詢：https://fonts.google.com/icons（風格選 Rounded）
 */
const CATEGORY_ICON: Record<string, string> = {
  // 支出
  飲食: 'restaurant',
  交通: 'directions_subway',
  購物: 'shopping_bag',
  娛樂: 'sports_esports',
  醫療: 'medical_services',
  學習: 'school',
  居家: 'home',
  社交: 'groups',
  旅遊: 'flight',
  其他: 'category',
  // 收入
  薪資: 'payments',
  投資收益: 'trending_up',
  其他收入: 'savings',
}

interface Props {
  transaction: TransactionWithRow
  onDelete: () => void
  isDeleting: boolean
}

export function TransactionItem({ transaction, onDelete, isDeleting }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const iconName = CATEGORY_ICON[transaction.category] ?? 'receipt_long'
  const sign = transaction.kind === '支出' ? '-' : '+'

  // ── 確認刪除 ────────────────────────────────────────────────────────────────
  if (confirmDelete) {
    return (
      <div className="flex items-center gap-3 px-5 py-3.5">
        <span className="text-sm text-ink-mid flex-1 truncate">
          確定刪除「{transaction.category}」？
        </span>
        <button
          onClick={() => setConfirmDelete(false)}
          className="text-sm text-ink-mid hover:text-ink-high px-3 py-1.5 rounded-lg transition-colors"
        >
          取消
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="text-sm text-negative hover:bg-negative/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {isDeleting ? '刪除中…' : '確認'}
        </button>
      </div>
    )
  }

  // ── 正常列 ──────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex items-center gap-4 px-5 py-3.5 group">
      {/* 圖示圓圈 */}
      <div className="w-11 h-11 rounded-full bg-surface-2 flex items-center justify-center shrink-0 text-ink-high">
        <MaterialIcon name={iconName} size={22} />
      </div>

      {/* 分類 + 備註 */}
      <div className="flex-1 min-w-0">
        <div className="text-base text-ink-high">{transaction.category}</div>
        {transaction.note && (
          <div className="text-sm text-ink-mid truncate mt-0.5">{transaction.note}</div>
        )}
      </div>

      {/* 金額（白色，不染紅/綠） */}
      <span className="font-mono text-base text-ink-high tabular-nums shrink-0">
        {sign}{formatCurrency(transaction.amount)}
      </span>

      {/* 刪除：絕對定位，預設隱藏，hover 才顯示（不影響金額位置） */}
      <button
        onClick={() => setConfirmDelete(true)}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-surface-1 text-ink-low/40 hover:text-negative hover:bg-negative/10 transition-colors opacity-0 group-hover:opacity-100"
        aria-label="刪除"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}
