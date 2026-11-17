import type {
  CourseType,
  StaffRole,
  TableLayoutPositionInput,
  TastingMenuItemInput,
} from '@/types'

const REQUIRED_SET_COURSES: ReadonlyArray<{
  courseType: CourseType
  label: string
}> = [
  { courseType: 'Appetizer', label: 'Khai vị' },
  { courseType: 'MainCourse', label: 'Món chính' },
  { courseType: 'Dessert', label: 'Tráng miệng' },
]

export interface DomainValidationResult {
  valid: boolean
  errors: Record<string, string>
}

/**
 * Validates that a Set Menu defines exactly one dish per required course:
 * Khai vị (Appetizer), Món chính (MainCourse), and Tráng miệng (Dessert).
 */
export function validateTastingMenuSelection(
  items: ReadonlyArray<TastingMenuItemInput>
): DomainValidationResult {
  const errors: Record<string, string> = {}

  for (const req of REQUIRED_SET_COURSES) {
    const matches = items.filter((i) => i.courseType === req.courseType)
    if (matches.length !== 1 || !matches[0]?.menuItemId) {
      errors[req.courseType] =
        `Set Menu phải chọn đúng 1 món cho nhóm ${req.label}`
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/** Validates snap-grid floor coordinates and seat counts before saving table layout. */
export function validateFloorPlanLayout(
  positions: ReadonlyArray<TableLayoutPositionInput>
): DomainValidationResult {
  const errors: Record<string, string> = {}
  for (const pos of positions) {
    if (!Number.isFinite(pos.posX) || pos.posX < 0 || !Number.isFinite(pos.posY) || pos.posY < 0) {
      errors[pos.tableId] = 'Tọa độ bàn không hợp lệ'
    } else if (
      pos.capacity !== undefined &&
      (!Number.isInteger(pos.capacity) || pos.capacity < 1 || pos.capacity > 20)
    ) {
      errors[pos.tableId] = 'Số ghế phải từ 1 đến 20'
    }
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Guards against a signed-in manager locking or demoting their own account.
 */
export function canModifyStaffAccount({
  actorId,
  targetId,
  nextIsActive,
  nextRole,
}: {
  actorId?: string | null
  targetId: string
  nextIsActive?: boolean
  nextRole?: StaffRole
}): { allowed: boolean; reason?: string } {
  if (!actorId || actorId !== targetId) {
    return { allowed: true }
  }
  if (nextIsActive === false) {
    return {
      allowed: false,
      reason: 'Không thể tự khóa tài khoản Quản lý đang đăng nhập',
    }
  }
  if (nextRole !== undefined && nextRole !== 'Manager') {
    return {
      allowed: false,
      reason: 'Không thể tự hạ quyền tài khoản Quản lý đang đăng nhập',
    }
  }
  return { allowed: true }
}
