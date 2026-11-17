import { useId, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

/** Accessible multiline text area with label and error state. */
export function Textarea({
  label,
  error,
  helperText,
  id,
  className,
  rows = 3,
  ...props
}: TextareaProps) {
  const autoId = useId()
  const textareaId = id ?? autoId
  const errorId = `${textareaId}-error`
  const helperId = `${textareaId}-helper`

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-xs font-medium text-ink-muted"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        className={cn(
          'w-full rounded-lg bg-card border px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-subtle transition-colors',
          'focus:outline-none focus:border-primary',
          error ? 'border-danger' : 'border-line',
          className
        )}
        {...props}
      />
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
