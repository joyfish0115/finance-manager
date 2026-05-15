import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { getCategoryIcon } from '@/lib/categoryIcons'
import type { TransactionWithRow } from '@/lib/google/transactionsApi'

const REVEAL_WIDTH = 88 // 露出來的刪除按鈕寬度
const SWIPE_THRESHOLD = 40 // 超過這個距離鬆開就維持露出狀態

interface Props {
  transaction: TransactionWithRow
  onDelete: () => void
  isDeleting: boolean
}

export function TransactionItem({ transaction, onDelete, isDeleting }: Props) {
  const navigate = useNavigate()

  // 滑動狀態
  const [translateX, setTranslateX] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [touching, setTouching] = useState(false)

  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const intent = useRef<'horizontal' | 'vertical' | null>(null)
  const swiped = useRef(false)

  const iconName = getCategoryIcon(transaction.category)
  const sign = transaction.kind === '支出' ? '-' : '+'

  // 點到此 row 以外的地方時自動收合（避免一直露出）
  useEffect(() => {
    if (!revealed) return
    function onDocClick() {
      setTranslateX(0)
      setRevealed(false)
    }
    // 延後綁定避免和「展開的那一下」click 衝突
    const t = setTimeout(() => document.addEventListener('click', onDocClick), 0)
    return () => {
      clearTimeout(t)
      document.removeEventListener('click', onDocClick)
    }
  }, [revealed])

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
    intent.current = null
    swiped.current = false
    setTouching(true)
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!touchStart.current) return
    const t = e.touches[0]
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y

    // 判斷意圖：太小就先別決定
    if (intent.current === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      intent.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
    }

    // 垂直滑動讓頁面捲動處理
    if (intent.current === 'vertical') return

    swiped.current = true
    let x = revealed ? -REVEAL_WIDTH + dx : dx
    x = Math.min(0, Math.max(x, -REVEAL_WIDTH))
    setTranslateX(x)
  }

  function onTouchEnd() {
    touchStart.current = null
    setTouching(false)
    if (intent.current !== 'horizontal') return

    if (translateX < -SWIPE_THRESHOLD) {
      setTranslateX(-REVEAL_WIDTH)
      setRevealed(true)
    } else {
      setTranslateX(0)
      setRevealed(false)
    }
  }

  function handleRowClick(e: React.MouseEvent) {
    // 剛剛是滑動，不要觸發 click
    if (swiped.current) {
      swiped.current = false
      e.preventDefault()
      return
    }
    // 在 revealed 狀態下點 row → 收合
    if (revealed) {
      setTranslateX(0)
      setRevealed(false)
      e.preventDefault()
      e.stopPropagation()
      return
    }
    navigate(`/transactions/${transaction.id}/edit`)
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!window.confirm('確定刪除這筆記帳？此操作無法復原。')) {
      setTranslateX(0)
      setRevealed(false)
      return
    }
    onDelete()
  }

  return (
    <div className="relative overflow-hidden bg-surface-1 group">
      {/* 背景：刪除按鈕（滑動才會露出） */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        aria-label="刪除"
        style={{ width: REVEAL_WIDTH }}
        className="absolute right-0 top-0 bottom-0 bg-negative text-white flex items-center justify-center gap-1.5 text-sm font-medium disabled:opacity-50"
      >
        {isDeleting ? (
          <span className="text-xs">刪除中…</span>
        ) : (
          <>
            <Trash2 size={18} />
            <span>刪除</span>
          </>
        )}
      </button>

      {/* 前景：交易內容 */}
      <div
        onClick={handleRowClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: touching ? 'none' : 'transform 200ms ease-out',
        }}
        className="relative flex items-center gap-4 px-5 py-3.5 bg-surface-1 cursor-pointer hover:bg-surface-2 select-none"
      >
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
          {sign}
          {formatCurrency(transaction.amount)}
        </span>

        {/* 桌機 hover 才出現的刪除按鈕（手機用滑動） */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="hidden md:flex absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-surface-1 text-ink-low/40 hover:text-negative hover:bg-negative/10 transition-colors opacity-0 group-hover:opacity-100 items-center justify-center"
          aria-label="刪除"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
