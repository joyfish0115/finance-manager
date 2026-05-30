import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useUpdateAccount } from '@/hooks/useAccounts'
import type { Account } from '@/types'

// zod v4：用 z.number() + valueAsNumber 取代 z.coerce.number()
const schema = z.object({
  balance: z.number({ error: '請輸入有效金額' }),
})
type FormValues = z.infer<typeof schema>

interface Props {
  account: Account
  onClose: () => void
}

/** 快速更新餘額用的輕量彈窗（每月最常做的動作）*/
export function EditBalanceModal({ account, onClose }: Props) {
  const update = useUpdateAccount()

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { balance: account.balance },
  })

  useEffect(() => {
    setFocus('balance')
  }, [setFocus])

  const onSubmit = async (values: FormValues) => {
    await update.mutateAsync({ ...account, balance: values.balance })
    onClose()
  }

  return (
    <Modal
      title={account.name ? `${account.bank}・${account.name}` : account.bank}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="最新餘額（NT$）"
          type="number"
          inputMode="numeric"
          step="1"
          hint="輸入您最新的帳戶餘額後儲存"
          error={errors.balance?.message}
          {...register('balance', { valueAsNumber: true })}
        />

        {update.error && (
          <p className="text-xs text-negative rounded-lg bg-negative/10 px-3 py-2">
            {String(update.error)}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting || update.isPending}>
            {isSubmitting || update.isPending ? '儲存中…' : '儲存'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
