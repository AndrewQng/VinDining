import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/useAuthStore'
import type { ApiErrorResponse } from '@/types'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5159/api'

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: unknown) => Promise.reject(error)
)

export interface BackendErrorEnvelope extends ApiErrorResponse {
  errors?: Record<string, string[]>
}

export function isApiResponseEnvelope(
  value: unknown
): value is { success: boolean; statusCode: number; data: unknown; timestamp: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    'statusCode' in value &&
    'data' in value &&
    'timestamp' in value
  )
}

export function normalizeLockoutErrorData(
  data: BackendErrorEnvelope,
  nowMs: number = Date.now()
): BackendErrorEnvelope {
  if (!data.code) {
    data.code = 'ACCOUNT_LOCKED'
  }
  if (data.remainingMinutes === undefined) {
    const lockedUntilIso = data.errors?.lockedUntil?.[0]
    if (lockedUntilIso) {
      const diffMs = Date.parse(lockedUntilIso) - nowMs
      data.remainingMinutes =
        Number.isFinite(diffMs) && diffMs > 0
          ? Math.max(1, Math.ceil(diffMs / 60_000))
          : 15
    } else {
      data.remainingMinutes = 15
    }
  }
  return data
}

apiClient.interceptors.response.use(
  (response) => {
    if (isApiResponseEnvelope(response.data)) {
      response.data = response.data.data
    }
    return response
  },
  (error: AxiosError<BackendErrorEnvelope>) => {
    const requestUrl = error.config?.url ?? ''
    const isLoginAttempt = requestUrl.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginAttempt) {
      useAuthStore.getState().logout()
    }
    if (error.response?.status === 423 && error.response.data) {
      normalizeLockoutErrorData(error.response.data)
    }
    return Promise.reject(error)
  }
)

export default apiClient
