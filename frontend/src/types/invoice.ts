export interface InvoiceItemDto {
  orderItemId: string
  itemName: string
  quantity: number
  unitPrice: number
  lineTotal: number
  status: string
}

export interface InvoicePreviewDto {
  orderId: string
  tableId: string
  tableNumber: string
  subtotal: number
  serviceCharge: number
  vatAmount: number
  deductedDeposit: number
  totalAmount: number
  hasUnservedItems: boolean
  unservedItemCount: number
  items: InvoiceItemDto[]
}

export interface SettleInvoiceRequest {
  orderId: string
  paymentMethod: number // 0 = Cash, 1 = Card, 2 = BankTransfer
  staffId?: string
}

export interface SettleInvoiceResponse {
  invoiceId: string
  message: string
}
