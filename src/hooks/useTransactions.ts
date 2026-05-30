import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/db/schema'
import type { Transaction } from '@/types'

export const TRANSACTIONS_KEY = ['transactions'] as const

/** 讀取所有交易（從本地 DB，排除已標記刪除的，按日期新→舊） */
async function fetchLocalTransactions(): Promise<Transaction[]> {
  const rows = await db.transactions
    .where('syncStatus')
    .notEqual('pending-delete')
    .toArray()
  return rows
    .map(({ syncStatus: _s, ...t }) => t)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function useTransactions() {
  return useQuery({
    queryKey: TRANSACTIONS_KEY,
    queryFn: fetchLocalTransactions,
  })
}

export function useAddTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Transaction, 'id'>) => {
      const id = crypto.randomUUID()
      await db.transactions.add({ id, ...data, syncStatus: 'pending-create' })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY }),
  })
}

export function useUpdateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Transaction) => {
      const existing = await db.transactions.get(data.id)
      // 如果原本是「待新增」狀態，更新後維持「待新增」（還沒上傳過）；
      // 否則標記為「待更新」
      const nextStatus =
        existing?.syncStatus === 'pending-create' ? 'pending-create' : 'pending-update'
      await db.transactions.put({ ...data, syncStatus: nextStatus })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY }),
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const existing = await db.transactions.get(id)
      if (!existing) return
      // 還沒上傳過 → 直接刪本地；已上傳過 → 留墓碑等同步
      if (existing.syncStatus === 'pending-create') {
        await db.transactions.delete(id)
      } else {
        await db.transactions.update(id, { syncStatus: 'pending-delete' })
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY }),
  })
}

/** 輔助：把交易列表按日期分組（最新在前） */
export function groupByDate(
  transactions: Transaction[],
): { date: string; items: Transaction[] }[] {
  const map = new Map<string, Transaction[]>()
  for (const t of transactions) {
    const group = map.get(t.date) ?? []
    group.push(t)
    map.set(t.date, group)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, items }))
}
