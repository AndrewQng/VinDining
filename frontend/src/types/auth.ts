export type StaffRole = 'Waitstaff' | 'Expediter' | 'Manager' | 'Admin'

export interface UserProfile {
  id: string
  username: string
  fullName: string
  email: string
  role: StaffRole
  phone?: string
  avatarUrl?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  refreshToken: string
  expiresAtUtc: string
  user: UserProfile
}

export interface RefreshTokenRequest {
  token: string
  refreshToken: string
}
