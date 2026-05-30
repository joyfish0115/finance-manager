import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { differenceInDays } from 'date-fns'
import { usePendingCount, useLastSyncedAt } from '@/hooks/useSync'

/** 在以下情況才會出現提醒： */
const PENDING_THRESHOLD = 10 // 待同步筆數達 10 筆
const DAYS_THRESHOLD = 7 // 或最後同步距今超過 7 天

/** 首頁頂部的「該同步了」提醒。平常不出現，避免干擾。 */
export function SyncReminder() {
  const { data: pending = 0 } = usePendingCount()
  const { data: lastSyncedAt } = useLastSyncedAt()

  if (pending === 0) return null

  const daysSinceSync = lastSyncedAt
    ? differenceInDays(new Date(), new Date(lastSyncedAt))
    : Infinity

  const reachedCount = pending >= PENDING_THRESHOLD
  const reachedDays = daysSinceSync >= DAYS_THRESHOLD

  if (!reachedCount && !reachedDays) return null

  const reason = reachedDays
    ? `已經 ${daysSinceSync === Infinity ? '一段時間' : `${daysSinceSync} 天`}沒同步`
    : `累積 ${pending} 筆未同步`

  return (
    <div className="mx-5 md:mx-8 mt-4">
      <Link
        to="/settings"
        className="flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 hover:bg-amber-400/15 transition-colors"
      >
        <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-ink-high font-medium">建議同步到 Google Sheet</div>
          <div className="text-xs text-ink-mid mt-0.5">
            {reason}，避免清掉瀏覽器資料時遺失紀錄
          </div>
        </div>
        <span className="text-xs text-amber-400 shrink-0 mt-1">前往同步 →</span>
      </Link>
    </div>
  )
}
