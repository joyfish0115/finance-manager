import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: Option[]
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, options, error, className = '', ...rest },
  ref,
) {
  return (
    <label className="block">
      <span className="block text-sm text-ink-high mb-1.5">{label}</span>
      <div className="relative">
        <select
          ref={ref}
          className={`w-full appearance-none rounded-lg border bg-surface-2 px-3 py-2.5 text-sm text-ink-high outline-none transition-colors focus:border-brand-400 focus:bg-surface-3 pr-9 ${
            error ? 'border-negative' : 'border-surface-border'
          } ${className}`}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* 自訂下拉箭頭 */}
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-low"
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-negative">{error}</p>}
    </label>
  )
})
