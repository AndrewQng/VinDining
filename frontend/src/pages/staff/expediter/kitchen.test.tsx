// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient, authApi, orderApi } from '@/services/api'
import { installMockAdapter, resetMockDb, seedFullKitchenDemo } from '@/services/mock'
import { useAuthStore } from '@/stores/useAuthStore'
import { KdsBoardPage } from '@/pages/kds/KdsBoardPage'
import { ExpediterPassPage } from './ExpediterPassPage'

function renderWithRouter(ui: React.ReactNode, initialEntry = '/') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/dieu-phoi" element={ui} />
          <Route path="/kds" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Expediter E1 Pass & KDS K1 components', () => {
  beforeEach(async () => {
    installMockAdapter(apiClient)
    resetMockDb()
    const res = await authApi.login({
      username: 'quan.lm',
      password: 'VinDining@2026',
    })
    useAuthStore.setState({
      token: res.token,
      user: res.user,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    cleanup()
    vi.restoreAllMocks()
  })

  it('updates SLA warning (80%) and overdue (>100%) states over simulated time on Pass', async () => {
    const t0 = new Date('2026-11-17T19:00:00.000Z')
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(t0)

    const waiter = await authApi.login({
      username: 'mai.tt',
      password: 'VinDining@2026',
    })
    useAuthStore.setState({ token: waiter.token, user: waiter.user })
    await apiClient.post('/tables/tbl-b06/walk-in', { guestCount: 2 })
    await orderApi.create({
      tableId: 'tbl-b06',
      guestCount: 2,
      items: [{ menuItemId: 'item-goi-tom-hum', quantity: 2 }], // 10 min SLA
    })

    const expediter = await authApi.login({
      username: 'quan.lm',
      password: 'VinDining@2026',
    })
    useAuthStore.setState({ token: expediter.token, user: expediter.user })

    renderWithRouter(<ExpediterPassPage />, '/dieu-phoi')

    const ticket = await screen.findByTestId('pass-ticket-B06-Course1-cooking')
    expect(ticket).toHaveAttribute('data-sla-status', 'normal')

    // +8 min -> 80% warning
    await act(async () => {
      vi.advanceTimersByTime(8 * 60_000)
    })
    expect(
      screen.getByTestId('pass-ticket-B06-Course1-cooking')
    ).toHaveAttribute('data-sla-status', 'warning')

    // +2m05s -> 10m05s (> 100%) overdue
    await act(async () => {
      vi.advanceTimersByTime(125_000)
    })
    expect(
      screen.getByTestId('pass-ticket-B06-Course1-cooking')
    ).toHaveAttribute('data-sla-status', 'overdue')
  })

  it('Pass buttons dispatch serve and optional-reason remake routes safely', async () => {
    const user = userEvent.setup()
    const serveSpy = vi.spyOn(orderApi, 'serveItem')
    const remakeSpy = vi.spyOn(orderApi, 'remakeItem')

    renderWithRouter(<ExpediterPassPage />, '/dieu-phoi')

    expect(
      await screen.findByTestId('pass-ticket-B03-Course2-cooking')
    ).toBeInTheDocument()

    // Request remake with empty optional reason on B03 Course 2
    const b03Card = screen.getByTestId('pass-ticket-B03-Course2-cooking')
    const remakeBtn = b03Card.querySelector(
      'button:has(.lucide-rotate-ccw)'
    ) as HTMLButtonElement
    await user.click(remakeBtn)
    await user.click(
      screen.getByRole('button', { name: 'Gửi yêu cầu làm lại' })
    )

    expect(remakeSpy).toHaveBeenCalledWith('ord-b03', 'oi-b03-3', {
      reason: null,
    })
    expect(
      await screen.findByTestId('pass-feedback-banner')
    ).toHaveTextContent(/Đã gửi yêu cầu làm lại/i)

    // Serve B08 remake item on Pass
    const b08Card = screen.getByTestId('pass-ticket-B08-Course2-remake')
    const serveBtn = b08Card.querySelector(
      'button:has(.lucide-check)'
    ) as HTMLButtonElement
    await user.click(serveBtn)

    expect(serveSpy).toHaveBeenCalledTimes(1)
  })

  it('KDS renders no data controls, paginates when full, and repeats Làm lại on page 2', async () => {
    seedFullKitchenDemo()
    window.innerHeight = 1080
    renderWithRouter(<KdsBoardPage />, '/kds')

    expect(await screen.findByTestId('kds-page-indicator')).toHaveTextContent(
      'Trang 1 / 2'
    )
    expect(
      screen.getByTestId('kds-lane-remake').querySelectorAll('article')
    ).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: /Trang sau/i }))
    expect(screen.getByTestId('kds-page-indicator')).toHaveTextContent(
      'Trang 2 / 2'
    )
    // Làm lại repeats on page 2
    expect(
      screen.getByTestId('kds-lane-remake').querySelectorAll('article')
    ).toHaveLength(1)

    // Only 2 buttons on the full KDS board (page prev/next), zero on single page
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })
})
