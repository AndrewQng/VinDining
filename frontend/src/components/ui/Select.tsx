import { useId, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

/** Accessible select dropdown styled with theme tokens. */
export function Select({
  label,
  error,
  options,
  placeholder,
  id,
  className,
  ...props
}: SelectProps) {
  const autoId = useId()
  const selectId = id ?? autoId
  const errorId = `${selectId}-error`

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-medium text-ink-muted"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'w-full h-10 appearance-none rounded-lg bg-card border pl-3.5 pr-9 text-sm text-ink transition-colors',
            'focus:outline-none focus:border-primary',
            error ? 'border-danger' : 'border-line',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="w-4 h-4 text-ink-subtle pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
          aria-hidden="true"
        />
      </div>
      {error && (
        <p id={errorId} className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
