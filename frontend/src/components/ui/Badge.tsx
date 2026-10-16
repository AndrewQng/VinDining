import React from 'react'
import { cn } from '@/lib/utils'

export type BadgeVariant =
  | 'available'
  | 'reserved'
  | 'occupied'
  | 'cleaning'
  | 'locked'
  | 'preparing'
  | 'served'
  | 'cancelled'
  | 'gold'
  | 'destructive'
  | 'outline'
  | 'default'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  dot?: boolean
}

export function Badge({
  className,
  variant = 'default',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    available: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    reserved: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    occupied: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    cleaning: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    locked: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
    preparing: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
    served: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    cancelled: 'bg-neutral-800 text-neutral-400 border-neutral-700',
    gold: 'bg-gold-500/15 text-gold-300 border-gold-500/30',
    destructive: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    outline: 'bg-transparent text-neutral-300 border-neutral-700',
    default: 'bg-neutral-800/80 text-neutral-300 border-neutral-700',
  }

  const dotColors: Record<BadgeVariant, string> = {
    available: 'bg-emerald-400',
    reserved: 'bg-amber-400',
    occupied: 'bg-rose-400',
    cleaning: 'bg-cyan-400',
    locked: 'bg-orange-400',
    preparing: 'bg-sky-400 animate-pulse',
    served: 'bg-purple-400',
    cancelled: 'bg-neutral-500',
    gold: 'bg-gold-400',
    destructive: 'bg-rose-400',
    outline: 'bg-neutral-400',
    default: 'bg-neutral-400',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide',
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  )
}
