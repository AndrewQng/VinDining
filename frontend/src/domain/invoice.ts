import type { OrderItemDto, OrderItemStatus } from '@/types'
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

export type BillLineInput = Pick<
  OrderItemDto,
  'id' | 'tastingMenuId' | 'itemName' | 'courseType' | 'quantity' | 'unitPrice' | 'status'
>

export interface BillLineItem {
  id: string
  label: string
  sublabel?: string
  quantity: number
  unitPrice: number
  lineTotal: number
  isServed: boolean
  isSetMenuGroup: boolean
  unservedNote?: string
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

const UNSERVED_LINE_NOTE = 'Chưa phục vụ, không tính'

function formatSetMenuGroupLine(
  setMenuId: string,
  setName: string,
  groupItems: ReadonlyArray<BillLineInput>
): BillLineItem {
  const quantity = groupItems[0]?.quantity ?? 1
  const unitPrice = groupItems.reduce((sum, item) => sum + item.unitPrice, 0)
  const lineTotal = groupItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )
  return {
    id: `set-${setMenuId}`,
    label: setName,
    quantity,
    unitPrice,
    lineTotal,
    isServed: true,
    isSetMenuGroup: true,
  }
}

function formatIndividualBillLine(
  item: BillLineInput,
  setName?: string
): BillLineItem {
  const isServed = item.status === 'Served'
  return {
    id: item.id,
    label: item.itemName,
    sublabel: setName ? `Thuộc ${setName}` : undefined,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: isServed ? item.quantity * item.unitPrice : 0,
    isServed,
    isSetMenuGroup: false,
    unservedNote: isServed ? undefined : UNSERVED_LINE_NOTE,
  }
}

/**
 * Formats order items for cashier billing and 80mm slip display.
 * Groups a fully served Set Menu into one package line; when partially served,
 * expands courses so served courses are billed by à la carte price proportions and
 * unserved courses remain listed at 0 ₫.
 */
export function buildBillLineItems(
  items: ReadonlyArray<BillLineInput>,
  tastingMenuNames: Record<string, string> = {}
): BillLineItem[] {
  const setGroups = new Map<string, BillLineInput[]>()
  const alacarteItems: BillLineInput[] = []

  for (const item of items) {
    if (item.tastingMenuId) {
      const existing = setGroups.get(item.tastingMenuId) ?? []
      existing.push(item)
      setGroups.set(item.tastingMenuId, existing)
    } else {
      alacarteItems.push(item)
    }
  }

  const lines: BillLineItem[] = []

  for (const [setMenuId, groupItems] of setGroups.entries()) {
    const setName = tastingMenuNames[setMenuId] ?? 'Set Menu'
    const allServed = groupItems.every((item) => item.status === 'Served')
    if (allServed) {
      lines.push(formatSetMenuGroupLine(setMenuId, setName, groupItems))
    } else {
      for (const item of groupItems) {
        lines.push(formatIndividualBillLine(item, setName))
      }
    }
  }

  for (const item of alacarteItems) {
    lines.push(formatIndividualBillLine(item))
  }

  return lines
}

/** Formats a raw invoice ID into a readable 6-character uppercase display code. */
export function formatInvoiceCode(id: string): string {
  const clean = id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  if (!clean) return '------'
  return clean.length > 6 ? clean.slice(-6) : clean
}
