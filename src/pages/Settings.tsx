import { Link } from 'react-router-dom'
import { ChevronLeft, ExternalLink, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { GOOGLE_CONFIG } from '@/lib/google/config'
import { useAuthStore } from '@/stores/useAuthStore'
import { usePendingCount, useLastSyncedAt, useSyncNow } from '@/hooks/useSync'

export function SettingsPage() {
  const signOut = useAuthStore((s) => s.signOut)
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_CONFIG.sheetId}/edit`

  const handleSignOut = () => {
    if (!confirm('登出後需要重新登入 Google 才能繼續使用，確定登出嗎？')) return
    signOut()
  }

  return (
    <>
      <div className="px-5 md:px-8 pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-ink-mid hover:text-ink-high transition-colors"
        >
          <ChevronLeft size={18} />
          返回總覽
        </Link>
      </div>
      <PageHeader title="設定" subtitle="Google 帳號連接與資料同步" />

      <div className="px-5 md:px-8 py-6 space-y-4 max-w-2xl">
        <SyncSection />

        <div className="rounded-xl border border-surface-border bg-surface-1 p-5">
          <h2 className="text-base mb-3">資料儲存位置</h2>
          <a
            href={sheetUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-brand-300 hover:text-brand-200"
          >
            在 Google Sheet 開啟
            <ExternalLink size={14} />
          </a>
          <p className="mt-3 text-xs text-ink-low leading-relaxed">
            您的所有資料都儲存在這個 Google Sheet 裡。可以直接打開、編輯、備份或匯出。
            這個 App 只是這份資料的另一種介面。
          </p>
        </div>

        <div className="rounded-xl border border-surface-border bg-surface-1 p-5">
          <h2 className="text-base mb-3">登出</h2>
          <p className="text-sm text-ink-mid mb-4 leading-relaxed">
            登出只會清除這台裝置的登入狀態，不會刪除您的資料。
          </p>
          <Button variant="ghost" onClick={handleSignOut}>
            登出 Google 帳號
          </Button>
        </div>
      </div>
    </>
  )
}

// ─── 同步區塊 ────────────────────────────────────────────────────────────────

function SyncSection() {
  const { data: pending = 0 } = usePendingCount()
  const { data: lastSyncedAt } = useLastSyncedAt()
  const sync = useSyncNow()

  const hasPending = pending > 0
  const isSyncing = sync.isPending

  const lastSyncedLabel = lastSyncedAt
    ? format(new Date(lastSyncedAt), 'MM/dd HH:mm')
    : '尚未同步過'

  return (
    <div className="rounded-xl border border-surface-border bg-surface-1 p-5">
      <h2 className="text-base mb-3">同步</h2>

      {/* 狀態列 */}
      <div className="flex items-center gap-2 mb-2">
        {hasPending ? (
          <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
        ) : (
          <CheckCircle2 size={16} className="text-positive" />
        )}
        <span className="text-sm text-ink-high">
          {hasPending ? `待同步：${pending} 筆變動` : '全部已同步'}
        </span>
      </div>

      <p className="text-xs text-ink-low mb-4">最後同步：{lastSyncedLabel}</p>

      <Button
        onClick={() => sync.mutate()}
        disabled={isSyncing}
        className="w-full"
      >
        {isSyncing ? (
          <>
            <RefreshCw size={16} className="animate-spin" />
            同步中…
          </>
        ) : (
          <>
            <RefreshCw size={16} />
            立即同步
          </>
        )}
      </Button>

      {sync.error && (
        <div className="mt-3 flex gap-2 rounded-lg bg-negative/10 border border-negative/30 p-3">
          <AlertCircle size={16} className="text-negative shrink-0 mt-0.5" />
          <div className="text-xs text-negative break-words">
            同步失敗：{String(sync.error)}
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-ink-low leading-relaxed">
        平常記帳會先存在這台手機上，按下「立即同步」才會寫回 Google Sheet。
        建議定期同步，避免清掉瀏覽器資料時遺失未同步的紀錄。
      </p>
    </div>
  )
}
