import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  backTo?: string
  backLabel?: string
  actions?: ReactNode
  className?: string
}

/** Consistent top header for staff and guest screens. */
export function PageHeader({
  title,
  subtitle,
  backTo,
  backLabel = 'Quay lại',
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-line',
        className
      )}
    >
      <div className="space-y-1 min-w-0">
        {backTo && (
          <Link
            to={backTo}
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-accent transition-colors mb-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{backLabel}</span>
          </Link>
        )}
        <h1 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 shrink-0">{actions}</div>
      )}
    </div>
  )
}
