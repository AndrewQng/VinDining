import { useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDialogBehavior } from './useDialogBehavior'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
} as const

/** Accessible modal dialog with focus trap, Esc dismissal, and body scroll lock. */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: ModalProps) {
  const titleId = useId()
  const descId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useDialogBehavior(open, onClose, panelRef)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim backdrop-blur-xs"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'w-full rounded-2xl bg-surface border border-line shadow-2xl overflow-hidden',
          SIZE_MAP[size],
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-line">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-ink">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-xs text-ink-muted mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-card-hover cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">{children}</div>

        {footer && (
          <div className="px-5 py-3.5 border-t border-line bg-card/50 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
