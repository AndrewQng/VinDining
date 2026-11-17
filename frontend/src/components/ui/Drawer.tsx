import { useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDialogBehavior } from './useDialogBehavior'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  placement?: 'bottom' | 'right' | 'left'
  children: ReactNode
  footer?: ReactNode
  className?: string
}

const PLACEMENT_CLASSES = {
  bottom: 'inset-x-0 bottom-0 rounded-t-2xl max-h-[85vh] w-full',
  right: 'inset-y-0 right-0 w-full max-w-sm rounded-l-2xl h-full',
  left: 'inset-y-0 left-0 w-full max-w-xs rounded-r-2xl h-full',
} as const

/** Accessible bottom sheet (mobile) or slide-over drawer. */
export function Drawer({
  open,
  onClose,
  title,
  placement = 'bottom',
  children,
  footer,
  className,
}: DrawerProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useDialogBehavior(open, onClose, panelRef)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-scrim backdrop-blur-xs"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'fixed bg-surface border border-line shadow-2xl flex flex-col',
          PLACEMENT_CLASSES[placement],
          className
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <h2 id={titleId} className="text-base font-semibold text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-card-hover cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="px-5 py-3.5 border-t border-line shrink-0 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
