import type { CurrentUserDto, LoginRequest, LoginResponse, ServiceRequestDto } from '@/types'
import { apiClient } from './client'

export { apiClient } from './client'

export const authApi = {
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', payload)
    return data
  },
  me: async (): Promise<CurrentUserDto> => {
    const { data } = await apiClient.get<CurrentUserDto>('/auth/me')
    return data
  },
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },
}

export const serviceCallApi = {
  getActive: async (): Promise<ServiceRequestDto[]> => {
    const { data } = await apiClient.get<ServiceRequestDto[]>('/service-calls/active')
    return data
  },
}
