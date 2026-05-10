import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchTransactions,
  addTransaction,
  deleteTransaction,
  type TransactionWithRow,
} from '@/lib/google/transactionsApi'
import type { Transaction } from '@/types'

export const TRANSACTIONS_KEY = ['transactions'] as const

export function useTransactions() {
  return useQuery({
    queryKey: TRANSACTIONS_KEY,
    queryFn: fetchTransactions,
  })
}

export function useAddTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Transaction, 'id'>) => addTransaction(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY }),
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rowIndex: number) => deleteTransaction(rowIndex),
    onSuccess: () => qc.invalidateQueries({ queryKey: TRANSACTIONS_KEY }),
  })
}

/** 輔助：把交易列表按日期分組（最新在前） */
export function groupByDate(
  transactions: TransactionWithRow[],
): { date: string; items: TransactionWithRow[] }[] {
  const map = new Map<string, TransactionWithRow[]>()
  for (const t of transactions) {
    const group = map.get(t.date) ?? []
    group.push(t)
    map.set(t.date, group)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, items }))
}
