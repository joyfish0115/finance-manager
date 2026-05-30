import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useAddRecurring, useUpdateRecurring, useDeleteRecurring } from '@/hooks/useRecurring'
import { useAccounts } from '@/hooks/useAccounts'
import type { Recurring, RecurringKind } from '@/types'

/** 把空字串轉成 undefined（給 z.number().optional() 用） */
function toOptionalNumber(v: unknown): number | undefined {
  if (v === '' || v === null || v === undefined) return undefined
  const n = Number(v)
  return isNaN(n) ? undefined : n
}

const schema = z.object({
  name: z.string().min(1, '請輸入名稱'),
  kind: z.enum(['投資', '固定支出']),
  amount: z.number({ error: '請輸入金額' }).positive('金額需大於 0'),
  dayOfMonth: z
    .number({ error: '請輸入扣款日' })
    .int('需為整數')
    .min(1, '需在 1-31 之間')
    .max(31, '需在 1-31 之間'),
  accountId: z.string().min(1, '請選擇帳戶'),
  holdingValue: z.number().optional(),
  returnRate: z.number().optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  /** 傳入則為編輯模式，否則為新增 */
  recurring?: Recurring
  onClose: () => void
}

export function RecurringFormModal({ recurring, onClose }: Props) {
  const isEdit = !!recurring
  const { data: accounts } = useAccounts()
  const add = useAddRecurring()
  const update = useUpdateRecurring()
  const del = useDeleteRecurring()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: recurring?.name ?? '',
      kind: recurring?.kind ?? '固定支出',
      amount: recurring?.amount,
      dayOfMonth: recurring?.dayOfMonth,
      accountId: recurring?.accountId ?? '',
      holdingValue: recurring?.holdingValue,
      returnRate: recurring?.returnRate,
    },
  })

  const kind = watch('kind')

  const accountOptions = [
    { value: '', label: '請選擇…' },
    ...(accounts ?? []).map((a) => ({
      value: a.id,
      label: a.name ? `${a.bank}・${a.name}` : a.bank,
    })),
  ]

  const onSubmit = async (values: FormValues) => {
    // 把 NaN（空欄位）轉成 undefined
    const cleanedHolding =
      values.holdingValue !== undefined && !isNaN(values.holdingValue)
        ? values.holdingValue
        : undefined
    const cleanedRate =
      values.returnRate !== undefined && !isNaN(values.returnRate)
        ? values.returnRate
        : undefined

    // 固定支出不需要持有總值/報酬率
    const investFields =
      values.kind === '投資'
        ? { holdingValue: cleanedHolding, returnRate: cleanedRate }
        : { holdingValue: undefined, returnRate: undefined }

    if (isEdit && recurring) {
      await update.mutateAsync({
        ...recurring,
        name: values.name,
        kind: values.kind,
        amount: values.amount,
        dayOfMonth: values.dayOfMonth,
        accountId: values.accountId,
        ...investFields,
      })
    } else {
      await add.mutateAsync({
        name: values.name,
        kind: values.kind,
        amount: values.amount,
        dayOfMonth: values.dayOfMonth,
        accountId: values.accountId,
        ...investFields,
      })
    }
    onClose()
  }

  const handleDelete = async () => {
    if (!recurring) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    await del.mutateAsync(recurring.id)
    onClose()
  }

  const mutError = add.error ?? update.error ?? del.error

  return (
    <Modal title={isEdit ? '編輯固定金流' : '新增固定金流'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* 名稱 */}
        <Input
          label="名稱"
          placeholder="例：Spotify、0050 ETF 定期定額"
          autoComplete="off"
          error={errors.name?.message}
          {...register('name')}
        />

        {/* 投資 / 固定支出 切換 */}
        <div>
          <span className="block text-sm text-ink-high mb-1.5">類型</span>
          <div className="flex rounded-lg overflow-hidden border border-surface-border">
            {(['固定支出', '投資'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setValue('kind', k as RecurringKind)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  kind === k
                    ? k === '投資'
                      ? 'bg-brand-500/20 text-brand-300'
                      : 'bg-amber-400/20 text-amber-400'
                    : 'text-ink-mid hover:bg-surface-2'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* 金額 + 扣款日（一排兩欄） */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="每月金額"
            type="number"
            inputMode="numeric"
            step="1"
            placeholder="0"
            error={errors.amount?.message}
            {...register('amount', { valueAsNumber: true })}
          />
          <Input
            label="扣款日"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            step="1"
            placeholder="1-31"
            error={errors.dayOfMonth?.message}
            {...register('dayOfMonth', { valueAsNumber: true })}
          />
        </div>

        {/* 扣款帳戶 */}
        {accounts && accounts.length === 0 ? (
          <div className="rounded-lg bg-amber-400/10 border border-amber-400/30 p-3 text-xs text-amber-300">
            您還沒有任何帳戶，請先到「帳戶餘額」頁面新增一個帳戶。
          </div>
        ) : (
          <Select
            label="扣款帳戶"
            options={accountOptions}
            error={errors.accountId?.message}
            {...register('accountId')}
          />
        )}

        {/* 投資專屬：持有總值 + 報酬率 */}
        {kind === '投資' && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Input
              label="持有總值（選填）"
              type="number"
              inputMode="numeric"
              step="1"
              placeholder="目前市值"
              hint="目前市值"
              error={errors.holdingValue?.message}
              {...register('holdingValue', { setValueAs: toOptionalNumber })}
            />
            <Input
              label="報酬率 %（選填）"
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="例：5.2"
              hint="負數請加 -"
              error={errors.returnRate?.message}
              {...register('returnRate', { setValueAs: toOptionalNumber })}
            />
          </div>
        )}

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
            disabled={isSubmitting || add.isPending || update.isPending}
          >
            {isSubmitting || add.isPending || update.isPending
              ? '儲存中…'
              : isEdit
                ? '儲存變更'
                : '新增'}
          </Button>
        </div>

        {/* 刪除（編輯模式才有） */}
        {isEdit && (
          <div className="pt-2 border-t border-surface-border">
            <button
              type="button"
              onClick={handleDelete}
              disabled={del.isPending}
              className="w-full py-2.5 text-sm rounded-lg text-negative hover:bg-negative/10 transition-colors disabled:opacity-50"
            >
              {del.isPending
                ? '刪除中…'
                : confirmDelete
                  ? '確認刪除？再按一次確認'
                  : '刪除這筆固定金流'}
            </button>
          </div>
        )}
      </form>
    </Modal>
  )
}
