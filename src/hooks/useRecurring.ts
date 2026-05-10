import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchRecurring,
  addRecurring,
  updateRecurring,
  deleteRecurring,
  type RecurringWithRow,
} from '@/lib/google/recurringApi'
import type { Recurring } from '@/types'

export const RECURRING_KEY = ['recurring'] as const

export function useRecurring() {
  return useQuery({
    queryKey: RECURRING_KEY,
    queryFn: fetchRecurring,
  })
}

export function useAddRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Recurring, 'id'>) => addRecurring(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: RECURRING_KEY }),
  })
}

export function useUpdateRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (r: RecurringWithRow) => updateRecurring(r),
    onSuccess: () => qc.invalidateQueries({ queryKey: RECURRING_KEY }),
  })
}

export function useDeleteRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rowIndex: number) => deleteRecurring(rowIndex),
    onSuccess: () => qc.invalidateQueries({ queryKey: RECURRING_KEY }),
  })
}
