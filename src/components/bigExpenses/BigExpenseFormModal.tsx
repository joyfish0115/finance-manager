import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import {
  useAddTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '@/hooks/useTransactions'
import type { Transaction } from '@/types'

const schema = z.object({
  date: z.string().min(1, '請選擇日期'),
  amount: z.number({ error: '請輸入有效金額' }).positive('金額需大於 0'),
  note: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  /** 傳入交易 → 編輯模式；不傳 → 新增模式 */
  transaction?: Transaction
  onClose: () => void
}

/**
 * 「大額消費」簡化版表單：只有日期、金額、備註。
 * 底層仍寫入同一張 transactions 表，新增時 kind/category 固定為「支出」「其他」；
 * 編輯時沿用原本的 kind/category，避免改動舊記帳資料的分類。
 */
export function BigExpenseFormModal({ transaction, onClose }: Props) {
  const isEdit = !!transaction
  const add = useAddTransaction()
  const update = useUpdateTransaction()
  const del = useDeleteTransaction()
  const isPending = add.isPending || update.isPending
  const mutError = add.error ?? update.error

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: transaction?.date ?? format(new Date(), 'yyyy-MM-dd'),
      amount: transaction?.amount,
      note: transaction?.note ?? '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    if (isEdit && transaction) {
      await update.mutateAsync({
        ...transaction,
        date: values.date,
        amount: values.amount,
        note: values.note?.trim() || undefined,
      })
    } else {
      await add.mutateAsync({
        date: values.date,
        kind: '支出',
        category: '其他',
        amount: values.amount,
        note: values.note?.trim() || undefined,
      })
    }
    onClose()
  }

  const handleDelete = () => {
    if (!transaction) return
    if (!window.confirm('確定刪除這筆紀錄？此操作無法復原。')) return
    del.mutate(transaction.id, {
      onSuccess: onClose,
      onError: (err) => window.alert(`刪除失敗：${String(err)}`),
    })
  }

  return (
    <Modal title={isEdit ? '編輯大額消費' : '新增大額消費'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="日期"
          type="date"
          error={errors.date?.message}
          {...register('date')}
        />

        <Input
          label="金額（NT$）"
          type="number"
          inputMode="numeric"
          step="1"
          placeholder="0"
          error={errors.amount?.message}
          {...register('amount', { valueAsNumber: true })}
        />

        <Input
          label="備註（選填）"
          placeholder="例：買機票、修電腦"
          autoComplete="off"
          error={errors.note?.message}
          {...register('note')}
        />

        {mutError && (
          <p className="text-xs text-negative rounded-lg bg-negative/10 px-3 py-2">
            {String(mutError)}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          {isEdit && (
            <Button
              type="button"
              variant="ghost"
              className="text-negative hover:text-negative"
              disabled={del.isPending}
              onClick={handleDelete}
            >
              {del.isPending ? '刪除中…' : '刪除'}
            </Button>
          )}
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting || isPending}>
            {isSubmitting || isPending ? '儲存中…' : isEdit ? '儲存變更' : '新增'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
