import type { OrderItemDto } from './order'

/** Canonical invoice settlement payment methods. */
export type PaymentMethod = 'Cash' | 'Card' | 'VietQR'

/** Pre-bill preview DTO returned by GET /api/invoices/preview/{tableId}. */
export interface InvoicePreviewDto {
  tableId: string
  tableNumber: string
  orderId: string
  guestCount: number
  waiterName?: string | null
  openedAt?: string | null
  checkoutRequestedAt?: string | null
  tastingMenuNames?: Record<string, string>
  items: OrderItemDto[]
  subtotal: number
  serviceCharge: number
  vatAmount: number
  totalAmount: number
  deductedDeposit: number
  amountDue: number
  vietQrPayload: string
  hasUnservedItems: boolean
}

/** Response returned by POST /api/invoices/{tableId}/print-preview. */
export interface PrintPreviewResponse {
  printedAt: string
  preview: InvoicePreviewDto
}

/** Settled invoice DTO matching the Invoices ERD table. */
export interface InvoiceDto {
  id: string
  orderId: string
  tableId: string
  tableNumber: string
  settleById: string
  settleByName: string
  guestCount?: number | null
  waiterName?: string | null
  items?: OrderItemDto[]
  tastingMenuNames?: Record<string, string>
  subtotal: number
  serviceCharge: number
  vatAmount: number
  deductedDeposit: number
  totalAmount: number
  amountDue: number
  paymentMethod: PaymentMethod
  isPaid: boolean
  surveyToken: string
  surveySentAt: string | null
  createdAt: string
}

/** Payload for POST /api/invoices/{tableId}/settle. */
export interface SettleInvoiceRequest {
  paymentMethod: PaymentMethod
}

/** Query filter for GET /api/invoices. */
export interface InvoiceFilter {
  date?: string
  paymentMethod?: PaymentMethod
}
