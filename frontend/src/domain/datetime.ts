const WEEKDAYS_VI = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
] as const

const ISO_WITHOUT_TZ_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/

/** Parses ISO timestamps, treating timezone-less server ISO strings as UTC. */
export function parseUtcTimestamp(value: Date | string): number {
  if (value instanceof Date) return value.getTime()
  const trimmed = value.trim()
  if (ISO_WITHOUT_TZ_RE.test(trimmed)) {
    return Date.parse(`${trimmed}Z`)
  }
  return Date.parse(trimmed)
}

function toDate(value: Date | string): Date {
  if (value instanceof Date) return value
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00`)
  }
  return new Date(parseUtcTimestamp(value))
}

/** Formats time as 24-hour "19:00" without seconds. */
export function formatSlotTime(value: Date | string): string {
  const d = toDate(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

/** Formats calendar date as "Thứ Tư, 18/11/2026". */
export function formatDate(value: Date | string): string {
  const d = toDate(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const weekday = WEEKDAYS_VI[d.getDay()]
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${weekday}, ${dd}/${mm}/${yyyy}`
}

/** Formats date and time together as "19:00 · Thứ Tư, 18/11/2026". */
export function formatDateTime(value: Date | string): string {
  const d = toDate(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return `${formatSlotTime(d)} · ${formatDate(d)}`
}

/** Formats relative time in minutes for staff notifications and order feeds. */
export function formatRelativeMinutes(
  value: Date | string,
  now: Date = new Date()
): string {
  const d = toDate(value)
  if (Number.isNaN(d.getTime())) return ''
  const diffMin = Math.round((now.getTime() - d.getTime()) / 60_000)
  if (Math.abs(diffMin) < 1) return 'vừa xong'
  if (diffMin > 0) return `${diffMin} phút trước`
  return `sau ${Math.abs(diffMin)} phút`
}
