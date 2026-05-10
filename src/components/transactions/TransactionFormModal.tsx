import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAddTransaction } from '@/hooks/useTransactions'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types'
import type { TransactionKind, TransactionCategory } from '@/types'

// category 在 schema 層面是 string（zod v4 與 resolver 的類型相容問題），
// 實際值由 chips 保證只能是合法的 TransactionCategory，submit 時再 cast。
const schema = z.object({
  date: z.string().min(1, '請選擇日期'),
  kind: z.enum(['支出', '收入']),
  category: z.string().min(1, '請選擇分類'),
  amount: z.number({ error: '請輸入金額' }).positive('金額需大於 0'),
  note: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  onClose: () => void
}

export function TransactionFormModal({ onClose }: Props) {
  const add = useAddTransaction()
  const today = format(new Date(), 'yyyy-MM-dd')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: today,
      kind: '支出',
      category: '',
      note: '',
    },
  })

  const kind = watch('kind')
  const selectedCategory = watch('category')

  // 切換支出/收入時重置分類
  const [prevKind, setPrevKind] = useState<TransactionKind>('支出')
  useEffect(() => {
    if (kind !== prevKind) {
      setValue('category', '')
      setPrevKind(kind)
    }
  }, [kind, prevKind, setValue])

  useEffect(() => {
    setFocus('amount')
  }, [setFocus])

  const categories = kind === '支出' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  const onSubmit = async (values: FormValues) => {
    await add.mutateAsync({
      date: values.date,
      kind: values.kind,
      category: values.category as TransactionCategory, // chips 保證合法值
      amount: values.amount,
      note: values.note || undefined,
    })
    onClose()
  }

  return (
    <Modal title="新增記帳" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* 日期 */}
        <Input
          label="日期"
          type="date"
          error={errors.date?.message}
          {...register('date')}
        />

        {/* 支出 / 收入 切換 */}
        <div>
          <span className="block text-sm text-ink-high mb-1.5">類型</span>
          <div className="flex rounded-lg overflow-hidden border border-surface-border">
            {(['支出', '收入'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setValue('kind', k)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  kind === k
                    ? k === '支出'
                      ? 'bg-negative/20 text-negative'
                      : 'bg-positive/20 text-positive'
                    : 'text-ink-mid hover:bg-surface-2'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* 分類 chips */}
        <div>
          <span className="block text-sm text-ink-high mb-1.5">分類</span>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setValue('category', cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selectedCategory === cat
                    ? 'border-brand-400 bg-brand-500/20 text-brand-300'
                    : 'border-surface-border text-ink-mid hover:border-brand-500/40 hover:text-ink-high'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {errors.category && (
            <p className="mt-1.5 text-xs text-negative">{errors.category.message}</p>
          )}
        </div>

        {/* 金額 */}
        <Input
          label="金額（NT$）"
          type="number"
          inputMode="numeric"
          step="1"
          placeholder="0"
          error={errors.amount?.message}
          {...register('amount', { valueAsNumber: true })}
        />

        {/* 備註 */}
        <Input
          label="備註（選填）"
          placeholder="例：午餐、便利商店…"
          error={errors.note?.message}
          {...register('note')}
        />

        {add.error && (
          <p className="text-xs text-negative rounded-lg bg-negative/10 px-3 py-2">
            {String(add.error)}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            取消
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting || add.isPending}
          >
            {isSubmitting || add.isPending ? '新增中…' : '新增'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
