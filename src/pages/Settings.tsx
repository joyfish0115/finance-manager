import { Link } from 'react-router-dom'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { GOOGLE_CONFIG } from '@/lib/google/config'
import { useAuthStore } from '@/stores/useAuthStore'

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
