import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  selected?: boolean
  interactive?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const PADDING_MAP = {
  none: '',
  sm: 'p-3.5',
  md: 'p-5',
  lg: 'p-6',
} as const

/** Surface card container using theme tokens. */
export function Card({
  selected = false,
  interactive = false,
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-surface border transition-colors',
        selected ? 'border-primary ring-1 ring-primary' : 'border-line',
        interactive && 'hover:bg-card-hover cursor-pointer',
        PADDING_MAP[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 space-y-1', className)} {...props} />
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-semibold text-ink leading-snug', className)}
      {...props}
    />
  )
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-ink-muted', className)} {...props} />
  )
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-3', className)} {...props} />
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-4 pt-4 border-t border-line flex items-center gap-3', className)}
      {...props}
    />
  )
}
