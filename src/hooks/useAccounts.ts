import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchAccounts,
  addAccount,
  updateAccount,
  deleteAccount,
  type AccountWithRow,
} from '@/lib/google/accountsApi'
import type { Account } from '@/types'

export const ACCOUNTS_KEY = ['accounts'] as const

/** 讀取所有帳戶 */
export function useAccounts() {
  return useQuery({
    queryKey: ACCOUNTS_KEY,
    queryFn: fetchAccounts,
  })
}

/** 新增帳戶 */
export function useAddAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Account, 'id'>) => addAccount(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  })
}

/** 更新帳戶（含餘額） */
export function useUpdateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (acc: AccountWithRow) => updateAccount(acc),
    onSuccess: () => qc.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  })
}

/** 刪除帳戶 */
export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rowIndex: number) => deleteAccount(rowIndex),
    onSuccess: () => qc.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  })
}
