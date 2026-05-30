import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/db/schema'
import type { Account } from '@/types'

export const ACCOUNTS_KEY = ['accounts'] as const

async function fetchLocalAccounts(): Promise<Account[]> {
  const rows = await db.accounts
    .where('syncStatus')
    .notEqual('pending-delete')
    .toArray()
  return rows.map(({ syncStatus: _s, ...a }) => a)
}

export function useAccounts() {
  return useQuery({
    queryKey: ACCOUNTS_KEY,
    queryFn: fetchLocalAccounts,
  })
}

export function useAddAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Account, 'id'>) => {
      const id = crypto.randomUUID()
      await db.accounts.add({ id, ...data, syncStatus: 'pending-create' })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  })
}

export function useUpdateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Account) => {
      const existing = await db.accounts.get(data.id)
      const nextStatus =
        existing?.syncStatus === 'pending-create' ? 'pending-create' : 'pending-update'
      await db.accounts.put({ ...data, syncStatus: nextStatus })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const existing = await db.accounts.get(id)
      if (!existing) return
      if (existing.syncStatus === 'pending-create') {
        await db.accounts.delete(id)
      } else {
        await db.accounts.update(id, { syncStatus: 'pending-delete' })
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  })
}
