import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/db/schema'
import type { Recurring } from '@/types'

export const RECURRING_KEY = ['recurring'] as const

async function fetchLocalRecurring(): Promise<Recurring[]> {
  const rows = await db.recurring
    .where('syncStatus')
    .notEqual('pending-delete')
    .toArray()
  return rows
    .map(({ syncStatus: _s, ...r }) => r)
    .sort((a, b) => a.dayOfMonth - b.dayOfMonth)
}

export function useRecurring() {
  return useQuery({
    queryKey: RECURRING_KEY,
    queryFn: fetchLocalRecurring,
  })
}

export function useAddRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Recurring, 'id'>) => {
      const id = crypto.randomUUID()
      await db.recurring.add({ id, ...data, syncStatus: 'pending-create' })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: RECURRING_KEY }),
  })
}

export function useUpdateRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Recurring) => {
      const existing = await db.recurring.get(data.id)
      const nextStatus =
        existing?.syncStatus === 'pending-create' ? 'pending-create' : 'pending-update'
      await db.recurring.put({ ...data, syncStatus: nextStatus })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: RECURRING_KEY }),
  })
}

export function useDeleteRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const existing = await db.recurring.get(id)
      if (!existing) return
      if (existing.syncStatus === 'pending-create') {
        await db.recurring.delete(id)
      } else {
        await db.recurring.update(id, { syncStatus: 'pending-delete' })
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: RECURRING_KEY }),
  })
}
