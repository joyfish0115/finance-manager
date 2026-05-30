import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMeta, META_KEYS } from '@/lib/db/schema'
import { syncNow, countPending } from '@/lib/sync/syncEngine'
import { TRANSACTIONS_KEY } from '@/hooks/useTransactions'
import { ACCOUNTS_KEY } from '@/hooks/useAccounts'
import { RECURRING_KEY } from '@/hooks/useRecurring'

export const PENDING_KEY = ['sync', 'pending'] as const
export const LAST_SYNCED_KEY = ['sync', 'lastSyncedAt'] as const

/** 目前還沒同步的筆數（react-query 自動快取，會被 mutation 觸發失效） */
export function usePendingCount() {
  return useQuery({
    queryKey: PENDING_KEY,
    queryFn: countPending,
    // 30 秒重新查一次，平常停留在 Settings 頁也能看到變化
    refetchInterval: 30_000,
  })
}

/** 最後一次成功同步的時間（ISO string） */
export function useLastSyncedAt() {
  return useQuery({
    queryKey: LAST_SYNCED_KEY,
    queryFn: () => getMeta(META_KEYS.lastSyncedAt),
  })
}

/** 觸發一次手動同步 */
export function useSyncNow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: syncNow,
    onSuccess: () => {
      // 同步完，所有相關快取都重新撈
      qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY })
      qc.invalidateQueries({ queryKey: RECURRING_KEY })
      qc.invalidateQueries({ queryKey: PENDING_KEY })
      qc.invalidateQueries({ queryKey: LAST_SYNCED_KEY })
    },
  })
}
