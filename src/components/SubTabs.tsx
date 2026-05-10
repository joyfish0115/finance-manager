import { NavLink } from 'react-router-dom'

export interface SubTab {
  to: string
  label: string
  /** 用在 NavLink 的 end prop，預設 false */
  end?: boolean
}

interface Props {
  tabs: SubTab[]
}

export function SubTabs({ tabs }: Props) {
  return (
    <div className="px-5 md:px-8 pt-3 border-b border-surface-border">
      <div className="flex gap-1">
        {tabs.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'text-ink-high'
                  : 'text-ink-low hover:text-ink-mid'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {label}
                {isActive && (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 bg-brand-400 rounded-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  )
}
