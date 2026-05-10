import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useAddAccount, useUpdateAccount } from '@/hooks/useAccounts'
import type { AccountWithRow } from '@/lib/google/accountsApi'

const ACCOUNT_TYPES = ['活存', '定存', '證券戶', '基金帳戶'] as const

// zod v4：用 z.number() + valueAsNumber 取代 z.coerce.number()
const schema = z.object({
  bank: z.string().min(1, '請輸入銀行名稱'),
  name: z.string().optional(),
  type: z.enum(ACCOUNT_TYPES),
  balance: z.number({ error: '請輸入有效金額' }),
})
type FormValues = z.infer<typeof schema>

interface Props {
  /** 傳入帳戶 → 編輯模式；不傳 → 新增模式 */
  account?: AccountWithRow
  onClose: () => void
}

export function AccountFormModal({ account, onClose }: Props) {
  const isEdit = !!account
  const add = useAddAccount()
  const update = useUpdateAccount()
  const isPending = add.isPending || update.isPending
  const mutError = add.error ?? update.error

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bank: account?.bank ?? '',
      name: account?.name ?? '',
      type: account?.type ?? '活存',
      balance: account?.balance ?? 0,
    },
  })

  const onSubmit = async (values: FormValues) => {
    if (isEdit && account) {
      await update.mutateAsync({
        ...account,
        bank: values.bank,
        name: values.name || undefined,
        type: values.type,
        balance: values.balance,
      })
    } else {
      await add.mutateAsync({
        bank: values.bank,
        name: values.name || undefined,
        type: values.type,
        balance: values.balance,
      })
    }
    onClose()
  }

  return (
    <Modal title={isEdit ? '編輯帳戶' : '新增帳戶'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="銀行名稱"
          placeholder="例：台新銀行"
          autoComplete="off"
          error={errors.bank?.message}
          {...register('bank')}
        />

        <Input
          label="帳戶暱稱（選填）"
          placeholder="例：薪轉帳戶、股票戶"
          autoComplete="off"
          hint="方便辨識，可以不填"
          error={errors.name?.message}
          {...register('name')}
        />

        <Select
          label="帳戶類型"
          options={ACCOUNT_TYPES.map((t) => ({ value: t, label: t }))}
          error={errors.type?.message}
          {...register('type')}
        />

        <Input
          label="目前餘額（NT$）"
          type="number"
          inputMode="numeric"
          step="1"
          placeholder="0"
          error={errors.balance?.message}
          {...register('balance', { valueAsNumber: true })}
        />

        {mutError && (
          <p className="text-xs text-negative rounded-lg bg-negative/10 px-3 py-2">
            {String(mutError)}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            取消
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting || isPending}
          >
            {isSubmitting || isPending
              ? '儲存中…'
              : isEdit
                ? '儲存變更'
                : '新增帳戶'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
