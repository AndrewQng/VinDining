import { cn } from '@/lib/utils'

export interface SkeletonProps {
  className?: string
}

/** Loading shimmer block using theme surface/border tokens. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-lg bg-card-hover border border-line/50',
        className
      )}
    />
  )
}
