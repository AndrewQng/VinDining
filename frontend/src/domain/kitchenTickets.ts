import type { CourseType, KitchenPendingTicketDto } from '@/types'
import { evaluateSla, type SlaState } from './sla'

export type TicketCourseKey = 'Course1' | 'Course2' | 'Course3'
export type KitchenLane = 'remake' | 'cooking' | 'onhold'

export interface GroupedKitchenTicket {
  id: string
  tableId: string
  tableNumber: string
  orderId: string
  courseKey: TicketCourseKey
  courseTitle: string
  lane: KitchenLane
  items: KitchenPendingTicketDto[]
  cookingStartedAt: string | null
  prepSlaMinutes: number
  slaStatus: SlaState
  elapsedSeconds: number
  slaSeconds: number
  remainingSeconds: number
  ratio: number
}

export interface KdsPaginatedView {
  remake: GroupedKitchenTicket[]
  cooking: GroupedKitchenTicket[]
  onHold: GroupedKitchenTicket[]
  page: number
  totalPages: number
  cookingTotal: number
  onHoldTotal: number
  cookingLaterCount: number
  onHoldLaterCount: number
}

const COURSE_KEY_MAP: Record<CourseType, TicketCourseKey> = {
  Appetizer: 'Course1',
  Beverage: 'Course1',
  MainCourse: 'Course2',
  Dessert: 'Course3',
}

const COURSE_TITLES: Record<TicketCourseKey, string> = {
  Course1: 'Course 1 — Khai vị & Đồ uống',
  Course2: 'Course 2 — Món chính',
  Course3: 'Course 3 — Tráng miệng',
}

function getTicketLane(item: KitchenPendingTicketDto): KitchenLane {
  if (item.status === 'OnHold') return 'onhold'
  if (item.isRemake) return 'remake'
  return 'cooking'
}

function getEarliestStart(items: ReadonlyArray<KitchenPendingTicketDto>): string | null {
  let earliestMs = Infinity
  let earliestIso: string | null = null
  for (const item of items) {
    if (!item.cookingStartedAt) continue
    const parsed = Date.parse(item.cookingStartedAt)
    if (!Number.isNaN(parsed) && parsed < earliestMs) {
      earliestMs = parsed
      earliestIso = item.cookingStartedAt
    }
  }
  return earliestIso
}

function compareByUrgency(a: GroupedKitchenTicket, b: GroupedKitchenTicket): number {
  if (b.ratio !== a.ratio) return b.ratio - a.ratio
  if (a.lane !== b.lane) return a.lane === 'remake' ? -1 : 1
  const aTime = a.cookingStartedAt ? Date.parse(a.cookingStartedAt) : Infinity
  const bTime = b.cookingStartedAt ? Date.parse(b.cookingStartedAt) : Infinity
  if (aTime !== bTime) return aTime - bTime
  const tblCmp = a.tableNumber.localeCompare(b.tableNumber)
  return tblCmp !== 0 ? tblCmp : a.courseKey.localeCompare(b.courseKey)
}

/**
 * Groups raw kitchen pending dish items into Course tickets per (tableId, courseKey, lane),
 * computes ticket Prep SLA as max item Prep SLA from course start (OPEN_QUESTIONS #12),
 * and sorts each bucket most urgent first.
 */
export function groupKitchenTickets(
  pendingItems: ReadonlyArray<KitchenPendingTicketDto>,
  now: Date = new Date()
): GroupedKitchenTicket[] {
  const buckets = new Map<string, KitchenPendingTicketDto[]>()

  for (const item of pendingItems) {
    if (item.status === 'Served') continue
    const courseKey = COURSE_KEY_MAP[item.courseType]
    const lane = getTicketLane(item)
    const key = `${item.orderId}::${courseKey}::${lane}`
    const existing = buckets.get(key)
    if (existing) {
      existing.push(item)
    } else {
      buckets.set(key, [item])
    }
  }

  const tickets: GroupedKitchenTicket[] = []
  for (const [id, items] of buckets.entries()) {
    const first = items[0]
    const courseKey = COURSE_KEY_MAP[first.courseType]
    const lane = getTicketLane(first)
    const prepSlaMinutes = Math.max(...items.map((i) => i.prepTimeMinutes), 0)
    const cookingStartedAt = lane === 'onhold' ? null : getEarliestStart(items)
    const sla =
      lane === 'onhold'
        ? { status: 'normal' as SlaState, elapsedSeconds: 0, slaSeconds: prepSlaMinutes * 60, ratio: 0 }
        : evaluateSla(cookingStartedAt, prepSlaMinutes, now)

    tickets.push({
      id,
      tableId: first.tableId,
      tableNumber: first.tableNumber,
      orderId: first.orderId,
      courseKey,
      courseTitle: COURSE_TITLES[courseKey],
      lane,
      items,
      cookingStartedAt,
      prepSlaMinutes,
      slaStatus: sla.status,
      elapsedSeconds: sla.elapsedSeconds,
      slaSeconds: sla.slaSeconds,
      remainingSeconds: sla.slaSeconds - sla.elapsedSeconds,
      ratio: sla.ratio,
    })
  }

  return tickets.sort(compareByUrgency)
}

/** Formats seconds as MM:SS for elapsed, SLA limit, and countdown displays. */
export function formatMinutesSeconds(totalSeconds: number): string {
  const abs = Math.max(0, Math.abs(Math.floor(totalSeconds)))
  const mins = Math.floor(abs / 60)
  const secs = abs % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

/** Computes KDS ticket rows per page from viewport height (3 rows at 1080px, 2 rows at 720px). */
export function computeKdsRowsPerPage(viewportHeightPx: number): number {
  const usable = Math.max(220, viewportHeightPx - 244)
  return Math.max(1, Math.floor(usable / 224))
}

/** Paginates KDS lanes: Làm lại repeats on every page while Đang nấu (2 cols) and Chờ (1 col) advance per page. */
export function paginateKdsLanes(
  tickets: ReadonlyArray<GroupedKitchenTicket>,
  requestedPage: number,
  rowsPerPage: number
): KdsPaginatedView {
  const remake = tickets.filter((t) => t.lane === 'remake')
  const cooking = tickets.filter((t) => t.lane === 'cooking')
  const onHold = tickets.filter((t) => t.lane === 'onhold')

  const cookingPerPage = Math.max(2, rowsPerPage * 2)
  const onHoldPerPage = Math.max(1, rowsPerPage)

  const totalPages = Math.max(
    1,
    Math.ceil(cooking.length / cookingPerPage),
    Math.ceil(onHold.length / onHoldPerPage)
  )
  const page = Math.min(Math.max(1, requestedPage), totalPages)

  const cookingStart = (page - 1) * cookingPerPage
  const onHoldStart = (page - 1) * onHoldPerPage
  const cookingEnd = cookingStart + cookingPerPage
  const onHoldEnd = onHoldStart + onHoldPerPage

  return {
    remake,
    cooking: cooking.slice(cookingStart, cookingEnd),
    onHold: onHold.slice(onHoldStart, onHoldEnd),
    page,
    totalPages,
    cookingTotal: cooking.length,
    onHoldTotal: onHold.length,
    cookingLaterCount: Math.max(0, cooking.length - cookingEnd),
    onHoldLaterCount: Math.max(0, onHold.length - onHoldEnd),
  }
}
