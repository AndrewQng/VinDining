import type { CurrentUserDto, StaffRole } from '@/types'
import type { MockDatabase } from './seed'

export type RouteAccess =
  | 'Public'
  | 'Guest'
  | 'KdsOrExpediter'
  | StaffRole[]

export interface MockRequestContext {
  db: MockDatabase
  params: Record<string, string>
  query: URLSearchParams
  body: unknown
  user: CurrentUserDto | null
  token: string | null
  now: Date
}

export interface MockHandlerResult {
  status: number
  data: unknown
}

export type MockRouteHandler = (ctx: MockRequestContext) => MockHandlerResult

export interface MockRouteDefinition {
  id: number
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  pattern: string
  access: RouteAccess
  handler: MockRouteHandler
}

export function ok(data: unknown, status = 200): MockHandlerResult {
  return { status, data }
}

export function fail(
  status: number,
  message: string,
  extra?: Record<string, unknown>
): MockHandlerResult {
  return { status, data: { message, ...extra } }
}

export function toPublicUser(staff: {
  id: string
  username: string
  fullName: string
  email: string
  phoneNumber: string
  role: StaffRole
}): CurrentUserDto {
  return {
    id: staff.id,
    username: staff.username,
    fullName: staff.fullName,
    email: staff.email,
    phoneNumber: staff.phoneNumber,
    role: staff.role,
  }
}
