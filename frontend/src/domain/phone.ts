/** Formats 10-digit Vietnamese phone numbers as "0901 234 567". */
export function formatPhoneNumber(phone: string): string {
  const trimmed = phone.trim()
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 10 && digits.startsWith('0')) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  }
  return trimmed
}
