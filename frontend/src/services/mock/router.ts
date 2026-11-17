import {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import type { CurrentUserDto } from '@/types'
import { getMockDb } from './db'
import { authRoutes } from './handlers/authHandlers'
import { invoiceRoutes } from './handlers/invoiceHandlers'
import { managerRoutes } from './handlers/managerHandlers'
import { menuRoutes } from './handlers/menuHandlers'
import { orderRoutes } from './handlers/orderHandlers'
import { reservationRoutes } from './handlers/reservationHandlers'
import { serviceAndFeedbackRoutes } from './handlers/serviceAndFeedbackHandlers'
import { tableRoutes } from './handlers/tableHandlers'
import type {
  MockHandlerResult,
  MockRouteDefinition,
  RouteAccess,
} from './types'

export const ALL_MOCK_ROUTES: MockRouteDefinition[] = [
  ...authRoutes,
  ...reservationRoutes,
  ...tableRoutes,
  ...orderRoutes,
  ...invoiceRoutes,
  ...menuRoutes,
  ...serviceAndFeedbackRoutes,
  ...managerRoutes,
]

function normalizeApiPath(rawUrl: string): { path: string; search: string } {
  const withoutOrigin = rawUrl.replace(/^https?:\/\/[^/]+/i, '')
  const [pathname, search = ''] = withoutOrigin.split('?')
  const stripped = pathname.replace(/^\/api(?=\/|$)/, '') || '/'
  return { path: stripped, search }
}

function matchPattern(
  pattern: string,
  actualPath: string
): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean)
  const actualParts = actualPath.split('/').filter(Boolean)
  if (patternParts.length !== actualParts.length) {
    return null
  }
  const params: Record<string, string> = {}
  for (let i = 0; i < patternParts.length; i += 1) {
    const p = patternParts[i]
    const a = actualParts[i]
    if (p.startsWith(':')) {
      params[p.slice(1)] = decodeURIComponent(a)
    } else if (p !== a) {
      return null
    }
  }
  return params
}

function authorizeRoute(
  access: RouteAccess,
  user: CurrentUserDto | null
): MockHandlerResult | null {
  if (access === 'Public' || access === 'Guest' || access === 'KdsOrExpediter') {
    return null
  }
  if (!user) {
    return { status: 401, data: { message: 'Vui lòng đăng nhập để tiếp tục' } }
  }
  if (user.role === 'Manager' || access.includes(user.role)) {
    return null
  }
  return {
    status: 403,
    data: { message: 'Tài khoản không có quyền thực hiện thao tác này' },
  }
}

function extractBearerToken(
  headers: InternalAxiosRequestConfig['headers']
): string | null {
  if (!headers) return null
  const raw =
    typeof headers.get === 'function'
      ? (headers.get('Authorization') ?? headers.get('authorization'))
      : (headers as Record<string, unknown>)['Authorization'] ??
        (headers as Record<string, unknown>)['authorization']
  if (typeof raw !== 'string') return null
  const match = /^Bearer\s+(.+)$/i.exec(raw.trim())
  return match ? match[1] : null
}

function buildSearchParams(
  search: string,
  paramsObj: unknown
): URLSearchParams {
  const qs = new URLSearchParams(search)
  if (paramsObj && typeof paramsObj === 'object') {
    for (const [key, val] of Object.entries(paramsObj)) {
      if (val !== undefined && val !== null) {
        qs.set(key, String(val))
      }
    }
  }
  return qs
}

function parseBody(data: unknown): unknown {
  if (typeof data !== 'string') return data
  try {
    return JSON.parse(data)
  } catch {
    return data
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export interface MockAdapterOptions {
  minLatencyMs?: number
  maxLatencyMs?: number
  nowProvider?: () => Date
}

/** Dispatches a single mock request directly (useful for adapter and deterministic tests). */
export function dispatchMockRequest(
  config: InternalAxiosRequestConfig,
  now: Date = new Date()
): MockHandlerResult {
  const method = (config.method ?? 'GET').toUpperCase() as MockRouteDefinition['method']
  const { path, search } = normalizeApiPath(config.url ?? '/')
  const db = getMockDb()
  const token = extractBearerToken(config.headers)
  const user = token ? db.sessions[token] ?? null : null

  for (const route of ALL_MOCK_ROUTES) {
    if (route.method !== method) continue
    const params = matchPattern(route.pattern, path)
    if (!params) continue

    const authError = authorizeRoute(route.access, user)
    if (authError) return authError

    return route.handler({
      db,
      params,
      query: buildSearchParams(search, config.params),
      body: parseBody(config.data),
      user,
      token,
      now,
    })
  }

  return {
    status: 404,
    data: { message: `Không tìm thấy endpoint ${method} ${path}` },
  }
}

/** Installs the mock axios adapter on apiClient with realistic 150–350 ms latency. */
export function installMockAdapter(
  client: AxiosInstance,
  options: MockAdapterOptions = {}
): void {
  const minLatency = options.minLatencyMs ?? 150
  const maxLatency = options.maxLatencyMs ?? 350
  const nowProvider = options.nowProvider ?? (() => new Date())

  client.defaults.adapter = async (config) => {
    if (maxLatency > 0) {
      const jitter =
        minLatency + Math.floor(Math.random() * (maxLatency - minLatency + 1))
      await sleep(jitter)
    }

    const result = dispatchMockRequest(config, nowProvider())
    const response: AxiosResponse = {
      data: result.data,
      status: result.status,
      statusText: result.status < 400 ? 'OK' : 'Error',
      headers: new AxiosHeaders({ 'content-type': 'application/json' }),
      config,
    }

    if (result.status >= 400) {
      throw new AxiosError(
        (result.data as { message?: string })?.message ?? 'Request failed',
        String(result.status),
        config,
        undefined,
        response
      )
    }

    return response
  }
}
