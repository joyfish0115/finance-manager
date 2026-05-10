import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * 通用 Modal 底層。
 * - 手機：從底部滑上來（rounded-t-2xl）
 * - 桌面：置中彈窗（rounded-2xl）
 * - Escape 鍵 / 點背景皆可關閉
 * - 內容區域可捲動（max-h + overflow-y-auto）
 */
export function Modal({ title, onClose, children }: Props) {
  // 鍵盤 Escape 關閉
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // 開啟時禁止背景捲動
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 彈窗本體 */}
      <div className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-surface-1 border border-surface-border shadow-2xl max-h-[90dvh] flex flex-col">
        {/* 標題列 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border shrink-0">
          <h2 className="font-medium text-ink-high">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-lg text-ink-mid hover:text-ink-high hover:bg-surface-2 transition-colors"
            aria-label="關閉"
          >
            <X size={18} />
          </button>
        </div>

        {/* 內容（可捲動） */}
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
