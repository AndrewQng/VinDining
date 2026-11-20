import { cn } from '@/lib/utils'

export interface WordmarkProps {
  subtitle?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASSES = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
} as const

/** Editorial Playfair Display brand wordmark matching the Figma prototype. */
export function Wordmark({
  subtitle,
  size = 'md',
  className,
}: WordmarkProps) {
  return (
    <div className={cn('inline-flex flex-col leading-none', className)}>
      <span
        className={cn(
          'font-serif font-semibold tracking-tight text-accent',
          SIZE_CLASSES[size]
        )}
      >
        VinDining
      </span>
      {subtitle && (
        <span className="mt-1 text-[11px] font-medium text-ink-muted">
          {subtitle}
        </span>
      )}
    </div>
  )
}
