/** Canonical staff roles defined by the VinDining RBAC matrix. */
export type StaffRole = 'Waitstaff' | 'Expediter' | 'Cashier' | 'Manager'

/** Authenticated staff profile returned by /api/auth/login and /api/auth/me. */
export interface CurrentUserDto {
  id: string
  username: string
  fullName: string
  email: string
  phoneNumber: string
  role: StaffRole
}

/** Payload for POST /api/auth/login. */
export interface LoginRequest {
  username: string
  password: string
}

/** Response returned by POST /api/auth/login. */
export interface LoginResponse {
  token: string
  expiresAtUtc: string
  user: CurrentUserDto
}
