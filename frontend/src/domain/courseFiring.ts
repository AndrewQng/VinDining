import type { CourseType, OrderItemStatus, TableStatus } from '@/types'

export interface FireableOrderItem {
  courseType: CourseType
  status: OrderItemStatus
  isRemake: boolean
  remakeCount: number
  isPriority: boolean
  cookingStartedAt: string | null
  servedAt: string | null
  servedById: string | null
}

/** Returns the initial kitchen status when an order is created (Course 1 & drinks cook immediately). */
export function getInitialOrderItemStatus(courseType: CourseType): OrderItemStatus {
  if (courseType === 'Appetizer' || courseType === 'Beverage') {
    return 'Cooking'
  }
  return 'OnHold'
}

/**
 * Resolves kitchen status when Waitstaff adds a new item to an active order:
 * Course 1/drinks cook immediately; Course 2/3 cook now if that course was already activated,
 * otherwise stay OnHold until Waitstaff activates the course.
 */
export function getAddedOrderItemStatus(
  existingItems: ReadonlyArray<Pick<FireableOrderItem, 'courseType' | 'status'>>,
  targetCourse: CourseType
): OrderItemStatus {
  if (targetCourse === 'Appetizer' || targetCourse === 'Beverage') {
    return 'Cooking'
  }
  const courseAlreadyActivated = existingItems.some(
    (item) => item.courseType === targetCourse && item.status !== 'OnHold'
  )
  return courseAlreadyActivated ? 'Cooking' : 'OnHold'
}

/** Returns the next activatable course ('MainCourse' before 'Dessert') with OnHold items, or null. */
export function getNextActivatableCourse(
  items: ReadonlyArray<Pick<FireableOrderItem, 'courseType' | 'status'>>
): 'MainCourse' | 'Dessert' | null {
  if (canFireCourse(items, 'MainCourse')) return 'MainCourse'
  if (canFireCourse(items, 'Dessert')) return 'Dessert'
  return null
}

/** Summarizes the collective status of a course group for display badges. */
export function getCourseAggregateStatus(
  items: ReadonlyArray<Pick<FireableOrderItem, 'status'>>
): OrderItemStatus {
  if (items.length === 0) return 'OnHold'
  if (items.every((item) => item.status === 'Served')) return 'Served'
  if (items.some((item) => item.status === 'Cooking' || item.status === 'Served')) {
    return 'Cooking'
  }
  return 'OnHold'
}

/** Order edits, course activation, transfer, and extra checkout calls are locked while PaymentPending. */
export function isOrderLockedForTable(status: TableStatus): boolean {
  return status === 'PaymentPending'
}

/** Returns true when at least one item in the target course is waiting OnHold. */
export function canFireCourse(
  items: ReadonlyArray<Pick<FireableOrderItem, 'courseType' | 'status'>>,
  targetCourse: CourseType
): boolean {
  return items.some(
    (item) => item.courseType === targetCourse && item.status === 'OnHold'
  )
}

/** Transitions all OnHold items in the target course to Cooking and applies priority if requested. */
export function fireCourseItems<T extends FireableOrderItem>(
  items: ReadonlyArray<T>,
  targetCourse: CourseType,
  startedAtIso: string,
  isPriority = false
): T[] {
  return items.map((item) => {
    if (item.courseType !== targetCourse || item.status !== 'OnHold') {
      return item
    }
    return {
      ...item,
      status: 'Cooking',
      cookingStartedAt: startedAtIso,
      isPriority: item.isPriority || isPriority,
    }
  })
}

/** Marks a Cooking item as Served at the Pass. Throws if item is not currently Cooking. */
export function markItemServed<T extends FireableOrderItem>(
  item: T,
  servedById: string,
  servedAtIso: string
): T {
  if (item.status !== 'Cooking') {
    throw new Error('Chỉ có thể xác nhận đi món khi món đang chế biến.')
  }
  return {
    ...item,
    status: 'Served',
    servedById,
    servedAt: servedAtIso,
  }
}

/** Marks a Cooking item for Remake, keeping status Cooking and incrementing remakeCount. */
export function markItemRemake<T extends FireableOrderItem>(
  item: T,
  remakeStartedAtIso: string
): T {
  if (item.status !== 'Cooking') {
    throw new Error('Chỉ có thể yêu cầu làm lại khi món đang ở trạng thái Đang nấu.')
  }
  return {
    ...item,
    status: 'Cooking',
    isRemake: true,
    remakeCount: item.remakeCount + 1,
    isPriority: true,
    cookingStartedAt: remakeStartedAtIso,
  }
}

/** Returns true when at least one item has been served (checkout precondition). */
export function hasAnyServedItem(
  items: ReadonlyArray<Pick<FireableOrderItem, 'status'>>
): boolean {
  return items.some((item) => item.status === 'Served')
}

/** Returns true when every item in the order is Served (invoice settlement precondition). */
export function areAllItemsServed(
  items: ReadonlyArray<Pick<FireableOrderItem, 'status'>>
): boolean {
  return items.length > 0 && items.every((item) => item.status === 'Served')
}
