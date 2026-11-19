import type { CSSProperties } from 'react'
import {
  MENU_ITEM_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  RESERVATION_STATUS_LABELS,
  SERVICE_REQUEST_STATUS_LABELS,
  TABLE_STATUS_LABELS,
  getOrderItemDisplayLabel,
} from '@/domain'
import { cn } from '@/lib/utils'
import type {
  MenuItemStatus,
  OrderItemStatus,
  OrderStatus,
  ReservationStatus,
  ServiceRequestStatus,
  TableStatus,
} from '@/types'

type BadgeTone =
  | 'success'
  | 'warning'
  | 'info'
  | 'accent'
  | 'purple'
  | 'danger'
  | 'neutral'

export type AnyDomainStatus =
  | TableStatus
  | OrderItemStatus
  | ReservationStatus
  | MenuItemStatus
  | OrderStatus
  | ServiceRequestStatus

const TONE_STYLES: Record<BadgeTone, CSSProperties> = {
  success: {
    backgroundColor: 'var(--badge-success-bg)',
    color: 'var(--badge-success-fg)',
    borderColor: 'var(--badge-success-border)',
  },
  warning: {
    backgroundColor: 'var(--badge-warning-bg)',
    color: 'var(--badge-warning-fg)',
    borderColor: 'var(--badge-warning-border)',
  },
  info: {
    backgroundColor: 'var(--badge-info-bg)',
    color: 'var(--badge-info-fg)',
    borderColor: 'var(--badge-info-border)',
  },
  accent: {
    backgroundColor: 'var(--badge-accent-bg)',
    color: 'var(--badge-accent-fg)',
    borderColor: 'var(--badge-accent-border)',
  },
  purple: {
    backgroundColor: 'var(--badge-purple-bg)',
    color: 'var(--badge-purple-fg)',
    borderColor: 'var(--badge-purple-border)',
  },
  danger: {
    backgroundColor: 'var(--badge-danger-bg)',
    color: 'var(--badge-danger-fg)',
    borderColor: 'var(--badge-danger-border)',
  },
  neutral: {
    backgroundColor: 'var(--badge-neutral-bg)',
    color: 'var(--badge-neutral-fg)',
    borderColor: 'var(--badge-neutral-border)',
  },
}

const STATUS_META_MAP: Record<
  AnyDomainStatus,
  { label: string; tone: BadgeTone }
> = {
  // TableStatus
  Available: { label: TABLE_STATUS_LABELS.Available, tone: 'success' },
  Locked: { label: TABLE_STATUS_LABELS.Locked, tone: 'warning' },
  Reserved: { label: TABLE_STATUS_LABELS.Reserved, tone: 'info' },
  Occupied: { label: TABLE_STATUS_LABELS.Occupied, tone: 'accent' },
  PaymentPending: { label: TABLE_STATUS_LABELS.PaymentPending, tone: 'purple' },
  Cleaning: { label: TABLE_STATUS_LABELS.Cleaning, tone: 'neutral' },

  // OrderItemStatus
  OnHold: { label: getOrderItemDisplayLabel('OnHold'), tone: 'neutral' },
  Cooking: { label: getOrderItemDisplayLabel('Cooking'), tone: 'warning' },
  Served: { label: getOrderItemDisplayLabel('Served'), tone: 'success' },

  // ReservationStatus
  PendingDeposit: {
    label: RESERVATION_STATUS_LABELS.PendingDeposit,
    tone: 'warning',
  },
  Expired_Cancelled: {
    label: RESERVATION_STATUS_LABELS.Expired_Cancelled,
    tone: 'neutral',
  },
  Cancelled_Refunded: {
    label: RESERVATION_STATUS_LABELS.Cancelled_Refunded,
    tone: 'info',
  },
  Cancelled_Forfeited: {
    label: RESERVATION_STATUS_LABELS.Cancelled_Forfeited,
    tone: 'danger',
  },
  RefundRejected: {
    label: RESERVATION_STATUS_LABELS.RefundRejected,
    tone: 'danger',
  },

  // MenuItemStatus (Available is shared with TableStatus -> use context prop if needed, or exact MenuItemStatus)
  SoldOut: { label: MENU_ITEM_STATUS_LABELS.SoldOut, tone: 'danger' },

  // OrderStatus
  Active: { label: ORDER_STATUS_LABELS.Active, tone: 'accent' },
  Paid: { label: ORDER_STATUS_LABELS.Paid, tone: 'success' },

  // ServiceRequestStatus
  Pending: { label: SERVICE_REQUEST_STATUS_LABELS.Pending, tone: 'warning' },
  Completed: { label: SERVICE_REQUEST_STATUS_LABELS.Completed, tone: 'success' },
}

export interface StatusBadgeProps {
  status: AnyDomainStatus
  domain?: 'table' | 'menuItem' | 'orderItem' | 'reservation' | 'order' | 'service'
  isRemake?: boolean
  dot?: boolean
  className?: string
}

/** Unified status pill mapped across every canonical domain enum in dark and light themes. */
export function StatusBadge({
  status,
  domain,
  isRemake = false,
  dot = false,
  className,
}: StatusBadgeProps) {
  let label = STATUS_META_MAP[status].label
  let tone = STATUS_META_MAP[status].tone

  if (domain === 'menuItem' && status === 'Available') {
    label = MENU_ITEM_STATUS_LABELS.Available
    tone = 'success'
  }
  if (status === 'Cooking' && isRemake) {
    label = getOrderItemDisplayLabel('Cooking', true)
    tone = 'danger'
  }

  return (
    <span
      style={TONE_STYLES[tone]}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-medium whitespace-nowrap',
        className
      )}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-current shrink-0"
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  )
}
