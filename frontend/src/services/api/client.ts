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

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const requestUrl = error.config?.url ?? ''
    const isLoginAttempt = requestUrl.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginAttempt) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

export default apiClient
