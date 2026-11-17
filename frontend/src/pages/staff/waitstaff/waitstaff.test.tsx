// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient, authApi, tableApi } from '@/services/api'
import { installMockAdapter, resetMockDb } from '@/services/mock'
import { realtimeClient } from '@/services/realtime/client'
import { useAuthStore } from '@/stores/useAuthStore'
import { useWaitstaffNotificationsStore } from '@/stores/useWaitstaffNotificationsStore'
import { ActiveOrderPage } from './ActiveOrderPage'
import { NotificationsPage } from './NotificationsPage'

function renderWaitstaffRoute(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/phuc-vu" element={<div>Sơ đồ bàn</div>} />
            <Route
              path="/phuc-vu/order/:tableId"
              element={<ActiveOrderPage />}
            />
            <Route path="/phuc-vu/thong-bao" element={<NotificationsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  }
}

describe('Waitstaff W5, W8x, W8b, and W9 components', () => {
  beforeEach(async () => {
    installMockAdapter(apiClient)
    resetMockDb()
    useWaitstaffNotificationsStore.getState().resetNotifications()
    const res = await authApi.login({
      username: 'mai.tt',
      password: 'VinDining@2026',
    })
    useAuthStore.setState({
      token: res.token,
      user: res.user,
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('shows W5 without priority toggle and blocks checkout on W8x when 0 items are served', async () => {
    const user = userEvent.setup()
    renderWaitstaffRoute('/phuc-vu/order/tbl-b08')

    expect(
      await screen.findByText(/Bàn B08 · Order đang phục vụ/i)
    ).toBeInTheDocument()
    expect(screen.queryByText(/Ưu tiên/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Priority/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Yêu cầu tính tiền' }))
    expect(await screen.findByText('Chưa thể tính tiền')).toBeInTheDocument()
    expect(
      screen.getByText(/Bàn chưa có món nào được phục vụ/i)
    ).toBeInTheDocument()
  })

  it('locks order mutations when PaymentPending (W8b) and unlocks if table reopens to Occupied', async () => {
    const user = userEvent.setup()
    const { queryClient } = renderWaitstaffRoute('/phuc-vu/order/tbl-b04')

    expect(
      await screen.findByText(/Bàn B04 · Chờ thanh toán/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Order đã khóa — không thể gọi thêm món/i)
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Gọi thêm món' })
    ).not.toBeInTheDocument()

    await tableApi.updateStatus('tbl-b04', 'Occupied')
    realtimeClient.publish('table:status-changed', {
      tableId: 'tbl-b04',
      tableNumber: 'B04',
      status: 'Occupied',
    })
    await queryClient.invalidateQueries({ queryKey: ['table', 'tbl-b04'] })

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Gọi thêm món' })
      ).toBeInTheDocument()
    })
    void user
  })

  it('marks service request complete on W9 -> W9b', async () => {
    const user = userEvent.setup()
    renderWaitstaffRoute('/phuc-vu/thong-bao')

    expect(
      await screen.findByText(/Bàn B03 · Yêu cầu: Châm nước/i)
    ).toBeInTheDocument()

    const confirmButtons = screen.getAllByRole('button', {
      name: 'Xác nhận đã phục vụ',
    })
    await user.click(confirmButtons[0])

    expect(await screen.findByText('Đã hoàn tất')).toBeInTheDocument()
  })
})
