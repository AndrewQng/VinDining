import type { KeyboardEvent, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface TabOption<T extends string = string> {
  value: T
  label: string
  badge?: string | number
  icon?: ReactNode
}

export interface TabsProps<T extends string = string> {
  items: TabOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/** Accessible horizontal tab bar with keyboard arrow navigation. */
export function Tabs<T extends string = string>({
  items,
  value,
  onChange,
  className,
}: TabsProps<T>) {
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const delta = e.key === 'ArrowRight' ? 1 : -1
    const nextIdx = (index + delta + items.length) % items.length
    onChange(items[nextIdx].value)
  }

  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 rounded-xl bg-card border border-line p-1 overflow-x-auto max-w-full',
        className
      )}
    >
      {items.map((item, idx) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer',
              active
                ? 'bg-surface text-accent border border-primary/50 shadow-xs'
                : 'text-ink-muted hover:text-ink border border-transparent'
            )}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-card-hover text-ink-muted tabular-nums">
                {item.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
