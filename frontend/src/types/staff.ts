import type { StaffRole } from './auth'

/** Staff account DTO matching the Staffs ERD table (never includes passwordHash). */
export interface StaffDto {
  id: string
  fullName: string
  phoneNumber: string
  username: string
  email: string
  role: StaffRole
  isActive: boolean
  failedLoginCount: number
  lockoutEnd: string | null
  createdAt: string
}

/** Payload for POST /api/manager/staff. */
export interface CreateStaffRequest {
  fullName: string
  phoneNumber: string
  username: string
  email: string
  role: StaffRole
  initialPassword?: string
}

/** Payload for PUT /api/manager/staff/{id}. */
export interface UpdateStaffRequest {
  fullName: string
  phoneNumber: string
  email: string
  role: StaffRole
}

/** Payload for POST /api/manager/staff/{id}/reset-password. */
export interface ResetPasswordRequest {
  newPassword: string
}

/** Payload for PATCH /api/manager/staff/{id}/status. */
export interface ToggleStaffStatusRequest {
  isActive: boolean
}

/** Query filter for GET /api/manager/staff. */
export interface StaffFilter {
  role?: StaffRole
  isActive?: boolean
  search?: string
}
