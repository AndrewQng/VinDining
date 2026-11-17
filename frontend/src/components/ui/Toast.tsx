import type { CSSProperties } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useToastStore, type ToastVariant } from '@/stores/useToastStore'

const VARIANT_STYLES: Record<ToastVariant, CSSProperties> = {
  info: {
    borderColor: 'var(--badge-info-border)',
    color: 'var(--badge-info-fg)',
  },
  success: {
    borderColor: 'var(--badge-success-border)',
    color: 'var(--badge-success-fg)',
  },
  warning: {
    borderColor: 'var(--badge-warning-border)',
    color: 'var(--badge-warning-fg)',
  },
  error: {
    borderColor: 'var(--badge-danger-border)',
    color: 'var(--badge-danger-fg)',
  },
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === 'success') return <CheckCircle2 className="w-4 h-4 shrink-0" />
  if (variant === 'warning' || variant === 'error') {
    return <AlertCircle className="w-4 h-4 shrink-0" />
  }
  return <Info className="w-4 h-4 shrink-0" />
}

/** Global accessible live toast notification region. */
export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-20 sm:bottom-4 right-4 z-[60] flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4 sm:px-0"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          style={VARIANT_STYLES[t.variant]}
          className="pointer-events-auto flex items-start gap-3 rounded-xl bg-surface border px-4 py-3 shadow-xl"
        >
          <span className="mt-0.5" aria-hidden="true">
            <ToastIcon variant={t.variant} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink">{t.title}</p>
            {t.description && (
              <p className="text-xs text-ink-muted mt-0.5">{t.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Đóng thông báo"
            className="p-1 rounded-md text-ink-muted hover:text-ink cursor-pointer"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  )
}
