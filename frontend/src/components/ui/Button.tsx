import React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isActuallyLoading = isLoading || loading
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

    const variants = {
      primary:
        'bg-gradient-to-r from-amber-500 via-gold-500 to-amber-600 text-neutral-950 font-semibold shadow-lg shadow-gold-500/20 hover:shadow-gold-500/30 hover:brightness-110 focus:ring-gold-400',
      secondary:
        'bg-neutral-800 text-neutral-100 hover:bg-neutral-700 border border-neutral-700/80 focus:ring-neutral-500',
      outline:
        'border border-gold-500/40 text-gold-300 hover:bg-gold-500/10 focus:ring-gold-400',
      danger:
        'bg-rose-600/90 hover:bg-rose-600 text-white shadow-lg shadow-rose-900/20 focus:ring-rose-500',
      ghost:
        'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/50 focus:ring-neutral-600',
    }

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-6 py-2.5 gap-2.5',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isActuallyLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isActuallyLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
