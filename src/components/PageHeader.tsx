import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <header className="flex items-start justify-between gap-4 px-5 md:px-8 pt-6 pb-4 border-b border-surface-border">
      <div>
        <h1 className="text-2xl font-semibold text-ink-high">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-mid">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
