import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

/** Consistent empty state placeholder for tables, lists, and reports. */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6 rounded-xl border border-dashed border-line bg-surface/60',
        className
      )}
    >
      <div
        className="w-12 h-12 rounded-xl bg-card border border-line flex items-center justify-center text-ink-muted mb-3"
        aria-hidden="true"
      >
        {icon ?? <Inbox className="w-5 h-5" />}
      </div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description && (
        <p className="text-xs text-ink-muted mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
