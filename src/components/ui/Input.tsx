import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: ReactNode
  error?: string
  /** 顯示在輸入框上方右側的補充元件，例如「去哪找？」連結 */
  rightSlot?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, hint, error, rightSlot, className = '', ...rest },
  ref,
) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-ink-high">{label}</span>
        {rightSlot}
      </div>
      <input
        ref={ref}
        className={`w-full rounded-lg border bg-surface-2 px-3 py-2.5 text-sm text-ink-high font-mono placeholder:text-ink-low/60 outline-none transition-colors focus:border-brand-400 focus:bg-surface-3 ${
          error ? 'border-negative' : 'border-surface-border'
        } ${className}`}
        {...rest}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-negative">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-low">{hint}</p>
      ) : null}
    </label>
  )
})
