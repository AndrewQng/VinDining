import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: ReactNode
  rightAction?: ReactNode
}

/** Accessible labeled text input with optional icon, helper text, and error message. */
export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightAction,
  id,
  className,
  ...props
}: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`
  const helperId = `${inputId}-helper`
  const describedBy = error ? errorId : helperText ? helperId : undefined

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-ink-muted"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span
            className="absolute left-3 text-ink-subtle pointer-events-none inline-flex"
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full h-10 rounded-lg bg-card border text-sm text-ink placeholder:text-ink-subtle transition-colors',
            'focus:outline-none focus:border-primary',
            error ? 'border-danger' : 'border-line',
            leftIcon ? 'pl-9' : 'px-3.5',
            rightAction ? 'pr-10' : 'pr-3.5',
            className
          )}
          {...props}
        />
        {rightAction && (
          <div className="absolute right-2 flex items-center">
            {rightAction}
          </div>
        )}
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-ink-subtle">
          {helperText}
        </p>
      ) : null}
    </div>
  )
}
