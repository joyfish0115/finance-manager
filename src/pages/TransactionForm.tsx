import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Delete, Trash2, X } from 'lucide-react'
import { format, addDays, subDays, parseISO, isToday as isDateToday } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { getCategoryIcon } from '@/lib/categoryIcons'
import {
  useAddTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useTransactions,
} from '@/hooks/useTransactions'
import {
  calcReducer,
  calcInitial,
  evaluateCalc,
  getCalcHint,
} from '@/components/transactions/calculator'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types'
import type { TransactionKind, TransactionCategory } from '@/types'

export function TransactionForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const add = useAddTransaction()
  const update = useUpdateTransaction()
  const del = useDeleteTransaction()
  const { data: transactions } = useTransactions()

  // 編輯模式：從快取中找到原資料
  const editing = useMemo(
    () => (isEdit ? transactions?.find((t) => t.id === id) : undefined),
    [isEdit, id, transactions],
  )

  const [kind, setKind] = useState<TransactionKind>('支出')
  const [category, setCategory] = useState<TransactionCategory | null>(null)
  const [note, setNote] = useState('')
  const [date, setDate] = useState<Date>(() => new Date())
  const [calc, dispatchCalc] = useReducer(calcReducer, calcInitial)
  const [error, setError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // 編輯模式：當交易資料載入後，預填表單（只填一次）
  useEffect(() => {
    if (!isEdit || !editing || hydrated) return
    setKind(editing.kind)
    setCategory(editing.category)
    setNote(editing.note ?? '')
    try {
      setDate(parseISO(editing.date))
    } catch {
      setDate(new Date())
    }
    dispatchCalc({ type: 'clear' })
    // 依金額字串逐位 dispatch，重建 calc state。
    // 用 toFixed(2) 避免浮點誤差顯示成 0.300000001，並清掉尾巴的 0。
    const amountStr = editing.amount.toFixed(2).replace(/\.?0+$/, '')
    for (const ch of amountStr) {
      if (/[0-9]/.test(ch)) dispatchCalc({ type: 'digit', d: ch })
      else if (ch === '.') dispatchCalc({ type: 'dot' })
    }
    setHydrated(true)
  }, [isEdit, editing, hydrated])

  // 切換支出/收入（user 觸發才會重置分類；不用 useEffect 避免 edit 模式被誤觸發）
  function onKindChange(newKind: TransactionKind) {
    setKind(newKind)
    setCategory(null)
  }

  const categories = kind === '支出' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  // 最近備註（選定分類後，只顯示該分類、同 kind、去重後最近 5 筆）
  const recentNotes = useMemo(() => {
    if (!category) return []
    const seen = new Set<string>()
    const result: string[] = []
    for (const t of transactions ?? []) {
      if (!t.note) continue
      if (t.kind !== kind) continue
      if (t.category !== category) continue
      if (seen.has(t.note)) continue
      seen.add(t.note)
      result.push(t.note)
      if (result.length >= 5) break
    }
    return result
  }, [transactions, kind, category])

  const isToday = isDateToday(date)
  const dateLabel = isToday
    ? `今日 ${format(date, 'yyyy/MM/dd')} ${format(date, 'EEEE', { locale: zhTW })}`
    : `${format(date, 'yyyy/MM/dd')} ${format(date, 'EEEE', { locale: zhTW })}`

  const calcHint = getCalcHint(calc)
  const displayAmount = `$${calc.current}`

  function handleSubmit() {
    setError(null)
    if (!category) {
      setError('請選擇分類')
      return
    }
    const amount = evaluateCalc(calc)
    if (!amount || amount <= 0) {
      setError('金額需大於 0')
      return
    }

    const onError = (err: unknown) => {
      window.alert(`儲存失敗：${String(err)}`)
    }

    if (isEdit && editing) {
      update.mutate(
        {
          id: editing.id,
          date: format(date, 'yyyy-MM-dd'),
          kind,
          category,
          amount,
          note: note.trim() || undefined,
        },
        { onError },
      )
    } else {
      add.mutate(
        {
          date: format(date, 'yyyy-MM-dd'),
          kind,
          category,
          amount,
          note: note.trim() || undefined,
        },
        { onError },
      )
    }
    navigate('/transactions')
  }

  function handleDelete() {
    if (!isEdit || !editing) return
    if (!window.confirm('確定刪除這筆記帳？此操作無法復原。')) return
    del.mutate(editing.id, {
      onError: (err) => window.alert(`刪除失敗：${String(err)}`),
    })
    navigate('/transactions')
  }


  // 鍵盤輸入支援（桌機可直接打字、按 Enter 送出）
  // 用 ref 包 handleSubmit 避免每次 render 都重新註冊 listener
  const handleSubmitRef = useRef<() => void>(() => {})
  handleSubmitRef.current = handleSubmit

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const inInput =
        target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement

      // Enter / = → 送出（即使焦點在備註欄）
      if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault()
        handleSubmitRef.current()
        return
      }

      // 在備註欄輸入時，數字/運算子讓使用者打字進備註，不送計算機
      if (inInput) return

      if (/^[0-9]$/.test(e.key)) {
        dispatchCalc({ type: 'digit', d: e.key })
        e.preventDefault()
      } else if (e.key === '.') {
        dispatchCalc({ type: 'dot' })
        e.preventDefault()
      } else if (e.key === '+') {
        dispatchCalc({ type: 'op', op: '+' })
        e.preventDefault()
      } else if (e.key === '-') {
        dispatchCalc({ type: 'op', op: '-' })
        e.preventDefault()
      } else if (e.key === '*' || e.key === 'x' || e.key === 'X') {
        dispatchCalc({ type: 'op', op: '×' })
        e.preventDefault()
      } else if (e.key === '/') {
        dispatchCalc({ type: 'op', op: '÷' })
        e.preventDefault()
      } else if (e.key === 'Backspace') {
        dispatchCalc({ type: 'back' })
        e.preventDefault()
      } else if (e.key === 'Escape') {
        dispatchCalc({ type: 'clear' })
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="h-[100dvh] flex flex-col bg-surface-0 overflow-hidden">
      {/* ── Header：返回 + 支出/收入切換 ── */}
      <header className="flex items-center px-3 pt-[max(0.75rem,calc(env(safe-area-inset-top)+0.25rem))] pb-3 border-b border-surface-border bg-surface-1">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg text-ink-mid hover:text-ink-high hover:bg-surface-2 transition-colors"
          aria-label="返回"
        >
          <X size={22} />
        </button>

        <div className="flex-1 flex justify-center">
          <div className="inline-flex rounded-full bg-surface-2 p-1">
            {(['支出', '收入'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => onKindChange(k)}
                className={`px-6 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  kind === k
                    ? k === '支出'
                      ? 'bg-negative/20 text-negative'
                      : 'bg-positive/20 text-positive'
                    : 'text-ink-mid'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* 右側：編輯模式顯示刪除按鈕，新增模式留空保持對齊 */}
        {isEdit ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={del.isPending}
            className="p-2 rounded-lg text-ink-mid hover:text-negative hover:bg-surface-2 transition-colors disabled:opacity-50"
            aria-label="刪除這筆記帳"
          >
            <Trash2 size={20} />
          </button>
        ) : (
          <div className="w-[38px]" />
        )}
      </header>

      {/* ── 主要內容：手機是垂直堆疊；桌機是 2 欄佈局 ── */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row md:max-w-6xl md:w-full md:mx-auto md:border-x md:border-surface-border">
        {/* ── 左欄：分類 grid ── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 md:py-8 md:px-8">
          <div className="mx-auto max-w-md md:max-w-none">
            <h2 className="hidden md:block text-sm font-medium text-ink-low uppercase tracking-wider mb-4">
              選擇分類
            </h2>
            <div className="grid grid-cols-4 md:grid-cols-5 gap-3 md:gap-4">
              {categories.map((cat) => {
                const selected = category === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat as TransactionCategory)}
                    className={`flex flex-col items-center gap-1.5 md:gap-2 py-3 md:py-4 rounded-2xl border transition-colors ${
                      selected
                        ? 'border-brand-400 bg-brand-500/15'
                        : 'border-transparent hover:bg-surface-2'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center ${
                        selected ? 'bg-brand-500/25 text-brand-300' : 'bg-surface-2 text-ink-high'
                      }`}
                    >
                      <MaterialIcon name={getCategoryIcon(cat)} size={24} />
                    </div>
                    <span
                      className={`text-xs md:text-sm ${selected ? 'text-brand-300' : 'text-ink-mid'}`}
                    >
                      {cat}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── 右欄：金額/備註/日期/計算機 ── */}
        <div className="flex flex-col md:w-[440px] md:shrink-0 md:border-l md:border-surface-border md:bg-surface-1">
          {/* 金額 + 備註列 */}
          <div className="px-4 md:px-6 py-3 md:py-5 border-t md:border-t-0 border-surface-border bg-surface-1">
            <div className="mx-auto max-w-md md:max-w-none">
              <div className="flex items-center gap-3">
                {/* 分類圖示 */}
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-surface-2 flex items-center justify-center text-ink-high shrink-0">
                  <MaterialIcon
                    name={category ? getCategoryIcon(category) : 'help_outline'}
                    size={20}
                  />
                </div>

                {/* 金額顯示 */}
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[11px] text-ink-low">TWD</span>
                    {calcHint && (
                      <span className="font-mono text-[11px] text-ink-low tabular-nums">
                        {calcHint}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xl md:text-2xl text-ink-high tabular-nums leading-tight">
                    {displayAmount}
                  </span>
                </div>

                {/* 備註輸入 */}
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="輸入備註"
                  className="flex-1 min-w-0 bg-transparent text-sm text-ink-high placeholder:text-ink-low focus:outline-none border-l border-surface-border pl-3"
                />
              </div>

              {/* 最近備註 chips */}
              {recentNotes.length > 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-none -mx-1 px-1">
                  {recentNotes.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNote(n)}
                      className="shrink-0 px-3 py-1 rounded-full bg-surface-2 text-xs text-ink-mid hover:text-ink-high hover:bg-surface-3 transition-colors"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}

              {error && (
                <p className="mt-2 text-xs text-negative">{error}</p>
              )}
            </div>
          </div>

          {/* 日期切換 */}
          <div className="px-4 md:px-6 py-2 md:py-3 border-t border-surface-border bg-surface-1">
            <div className="mx-auto max-w-md md:max-w-none flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDate((d) => subDays(d, 1))}
                aria-label="前一天"
                className="p-1.5 rounded-lg text-ink-mid hover:text-ink-high hover:bg-surface-2 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-ink-high font-medium min-w-[14rem] text-center">
                {dateLabel}
              </span>
              <button
                type="button"
                onClick={() => setDate((d) => addDays(d, 1))}
                disabled={isToday}
                aria-label="後一天"
                className="p-1.5 rounded-lg text-ink-mid hover:text-ink-high hover:bg-surface-2 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-mid"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* 桌機鍵盤提示 */}
          <div className="hidden md:block px-6 py-2 text-center text-[11px] text-ink-low bg-surface-1 border-t border-surface-border">
            可直接用鍵盤輸入 · Enter 送出 · Esc 清除
          </div>

          {/* 桌機：填滿右欄剩餘空間，把計算機推到下方 */}
          <div className="hidden md:block flex-1 bg-surface-1" />

          {/* 計算機鍵盤 */}
          <div className="px-3 md:px-6 pt-3 md:pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-6 bg-surface-1 border-t border-surface-border">
            <div className="mx-auto max-w-md md:max-w-none grid grid-cols-5 grid-rows-4 gap-2">
          {/* Row 1 */}
          <KeyDigit onPress={() => dispatchCalc({ type: 'digit', d: '7' })}>7</KeyDigit>
          <KeyDigit onPress={() => dispatchCalc({ type: 'digit', d: '8' })}>8</KeyDigit>
          <KeyDigit onPress={() => dispatchCalc({ type: 'digit', d: '9' })}>9</KeyDigit>
          <KeyOp active={calc.op === '÷'} onPress={() => dispatchCalc({ type: 'op', op: '÷' })}>
            ÷
          </KeyOp>
          <KeyUtil onPress={() => dispatchCalc({ type: 'clear' })}>AC</KeyUtil>

          {/* Row 2 */}
          <KeyDigit onPress={() => dispatchCalc({ type: 'digit', d: '4' })}>4</KeyDigit>
          <KeyDigit onPress={() => dispatchCalc({ type: 'digit', d: '5' })}>5</KeyDigit>
          <KeyDigit onPress={() => dispatchCalc({ type: 'digit', d: '6' })}>6</KeyDigit>
          <KeyOp active={calc.op === '×'} onPress={() => dispatchCalc({ type: 'op', op: '×' })}>
            ×
          </KeyOp>
          <KeyUtil onPress={() => dispatchCalc({ type: 'back' })} aria-label="退格">
            <Delete size={18} />
          </KeyUtil>

          {/* Row 3 */}
          <KeyDigit onPress={() => dispatchCalc({ type: 'digit', d: '1' })}>1</KeyDigit>
          <KeyDigit onPress={() => dispatchCalc({ type: 'digit', d: '2' })}>2</KeyDigit>
          <KeyDigit onPress={() => dispatchCalc({ type: 'digit', d: '3' })}>3</KeyDigit>
          <KeyOp active={calc.op === '+'} onPress={() => dispatchCalc({ type: 'op', op: '+' })}>
            +
          </KeyOp>

          {/* Row 4 */}
          <KeyDigit onPress={() => dispatchCalc({ type: 'digit', d: '00' })}>00</KeyDigit>
          <KeyDigit onPress={() => dispatchCalc({ type: 'digit', d: '0' })}>0</KeyDigit>
          <KeyDigit onPress={() => dispatchCalc({ type: 'dot' })}>.</KeyDigit>
          <KeyOp active={calc.op === '-'} onPress={() => dispatchCalc({ type: 'op', op: '-' })}>
            −
          </KeyOp>

          {/* OK：明確定位 col 5、row 3-4 */}
          <button
            type="button"
            onClick={handleSubmit}
            className="col-start-5 row-start-3 row-span-2 rounded-2xl bg-brand-500 text-white font-medium text-base hover:bg-brand-400 active:bg-brand-600 transition-colors flex items-center justify-center"
          >
            OK
          </button>
            </div>
          </div>
          {/* /右欄 */}
        </div>
      </div>
      {/* /主要內容 */}
    </div>
  )
}

// ─── 按鍵元件 ────────────────────────────────────────────────────────────────

function KeyDigit({
  children,
  onPress,
}: {
  children: React.ReactNode
  onPress: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="h-12 md:h-11 rounded-2xl bg-surface-2 text-ink-high text-lg font-mono hover:bg-surface-3 active:bg-surface-3 transition-colors"
    >
      {children}
    </button>
  )
}

function KeyOp({
  children,
  onPress,
  active,
}: {
  children: React.ReactNode
  onPress: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={`h-12 md:h-11 rounded-2xl text-lg font-mono transition-colors ${
        active
          ? 'bg-brand-500 text-white'
          : 'bg-brand-500/15 text-brand-300 hover:bg-brand-500/25'
      }`}
    >
      {children}
    </button>
  )
}

function KeyUtil({
  children,
  onPress,
  ...rest
}: {
  children: React.ReactNode
  onPress: () => void
  'aria-label'?: string
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="h-12 md:h-11 rounded-2xl bg-surface-3 text-ink-mid hover:text-ink-high hover:bg-surface-3 active:bg-surface-3 transition-colors flex items-center justify-center"
      {...rest}
    >
      {children}
    </button>
  )
}
