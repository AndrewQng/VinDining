const vndFormatter = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 0,
})

/** Formats an integer VND amount as "1.800.000 ₫" (no decimals). */
export function formatVnd(amount: number): string {
  const rounded = Math.round(amount)
  if (Object.is(rounded, -0) || rounded === 0) {
    return '0 ₫'
  }
  return `${vndFormatter.format(rounded)} ₫`
}

/** Formats a signed deduction line such as "−2.160.000 ₫". */
export function formatVndDeduction(amount: number): string {
  const absRounded = Math.abs(Math.round(amount))
  if (absRounded === 0) {
    return '0 ₫'
  }
  return `−${vndFormatter.format(absRounded)} ₫`
}
