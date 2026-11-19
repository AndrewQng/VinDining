import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { isMockMode } from '@/lib/utils'
import { installMockAdapter } from '@/services/mock/router'
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

if (isMockMode()) {
  installMockAdapter(apiClient)
}

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

interface BackendErrorEnvelope extends ApiErrorResponse {
  errors?: Record<string, string[]>
}

function isApiResponseEnvelope(
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
      const data = error.response.data
      if (!data.code) {
        data.code = 'ACCOUNT_LOCKED'
      }
      if (data.remainingMinutes === undefined) {
        const lockedUntilIso = data.errors?.lockedUntil?.[0]
        if (lockedUntilIso) {
          const diffMs = Date.parse(lockedUntilIso) - Date.now()
          data.remainingMinutes =
            Number.isFinite(diffMs) && diffMs > 0
              ? Math.max(1, Math.ceil(diffMs / 60_000))
              : 15
        } else {
          data.remainingMinutes = 15
        }
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
