import type { OrderItemStatus } from '@/types'
import { SERVICE_CHARGE_RATE, VAT_RATE } from './constants'

export interface InvoiceLineInput {
  quantity: number
  unitPrice: number
  status: OrderItemStatus
}

export interface InvoiceCalculationResult {
  subtotal: number
  serviceCharge: number
  vatAmount: number
  totalAmount: number
  deductedDeposit: number
  amountDue: number
}

/** Computes invoice subtotal (served items only), 5% service charge, 10% VAT, and deposit deduction in integer VND. */
export function calculateInvoiceTotals(
  items: ReadonlyArray<InvoiceLineInput>,
  depositAmount: number
): InvoiceCalculationResult {
  const subtotal = Math.round(
    items.reduce((sum, item) => {
      if (item.status !== 'Served') {
        return sum
      }
      return sum + item.quantity * item.unitPrice
    }, 0)
  )
  const serviceCharge = Math.round(subtotal * SERVICE_CHARGE_RATE)
  const vatAmount = Math.round((subtotal + serviceCharge) * VAT_RATE)
  const totalAmount = subtotal + serviceCharge + vatAmount
  const deductedDeposit = Math.max(0, Math.round(depositAmount))
  const amountDue = Math.max(0, totalAmount - deductedDeposit)

  return {
    subtotal,
    serviceCharge,
    vatAmount,
    totalAmount,
    deductedDeposit,
    amountDue,
  }
}

/**
 * Allocates a TastingMenu package price across its component courses in integer VND
 * so the sum of component unitPrices equals the exact Set Menu price per guest.
 */
export function allocateSetMenuUnitPrices(
  setMenuPrice: number,
  componentPrices: ReadonlyArray<number>
): number[] {
  if (componentPrices.length === 0) return []
  const target = Math.max(0, Math.round(setMenuPrice))
  const rawTotal = componentPrices.reduce((sum, p) => sum + Math.max(0, p), 0)

  if (rawTotal <= 0) {
    const base = Math.floor(target / componentPrices.length)
    const remainder = target - base * componentPrices.length
    return componentPrices.map((_, i) => (i === 0 ? base + remainder : base))
  }

  const allocated = componentPrices.map((p) =>
    Math.floor((Math.max(0, p) / rawTotal) * target)
  )
  const allocatedSum = allocated.reduce((sum, p) => sum + p, 0)
  allocated[0] += target - allocatedSum
  return allocated
}
