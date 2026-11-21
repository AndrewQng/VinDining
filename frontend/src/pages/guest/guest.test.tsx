// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient, menuApi } from '@/services/api'
import { installMockAdapter, resetMockDb } from '@/services/mock'
import {
  canAdvanceFromStep,
  clearBookingDraft,
  createInitialBookingDraft,
  getPreviousBookingStep,
  loadBookingDraft,
  saveBookingDraft,
  validateContactFields,
} from './bookingState'
import { EMenuPage } from './EMenuPage'
import { LookupReservationPage } from './LookupReservationPage'

function renderWithQuery(ui: React.ReactNode, initialEntry = '/') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('G1 booking step state machine', () => {
  beforeEach(() => {
    clearBookingDraft()
  })

  it('transitions back cleanly across steps and persists draft in sessionStorage', () => {
    const draft = createInitialBookingDraft({
      setId: 'set-thuong-hang',
      zone: 'VIP',
    })
    expect(draft.step).toBe('time-zone')
    expect(draft.preOrderedTastingMenuId).toBe('set-thuong-hang')
    expect(draft.zone).toBe('VIP')
    expect(canAdvanceFromStep(draft)).toBe(true)

    expect(getPreviousBookingStep('time-zone')).toBeNull()
    expect(getPreviousBookingStep('table')).toBe('time-zone')
    expect(getPreviousBookingStep('set-menu')).toBe('table')
    expect(getPreviousBookingStep('contact')).toBe('set-menu')
    expect(getPreviousBookingStep('hold')).toBe('contact')

    const step2 = { ...draft, step: 'table' as const }
    expect(canAdvanceFromStep(step2)).toBe(false)
    saveBookingDraft({ ...step2, tableId: 'tbl-v01', tableNumber: 'V01' })
    const restored = loadBookingDraft()
    expect(restored.step).toBe('table')
    expect(restored.tableId).toBe('tbl-v01')
  })

  it('validates guest contact fields', () => {
    const errors = validateContactFields({
      fullName: 'A',
      phoneNumber: '123',
      email: 'bad-email',
    })
    expect(errors.fullName).toBeDefined()
    expect(errors.phoneNumber).toBeDefined()
    expect(errors.email).toBeDefined()

    const okErrors = validateContactFields({
      fullName: 'Nguyễn Văn An',
      phoneNumber: '0901 234 567',
      email: 'an.nguyen@email.com',
    })
    expect(okErrors).toEqual({})
  })
})

describe('G2 lookup & cancellation policy branch (>= 4h vs < 4h)', () => {
  beforeEach(() => {
    installMockAdapter(apiClient, { minLatencyMs: 0, maxLatencyMs: 0 })
    resetMockDb()
  })

  afterEach(() => {
    cleanup()
  })

  it('does not reveal booking on wrong phone and shows forfeit warning for < 4h booking VD-7K3Q', async () => {
    const user = userEvent.setup()
    renderWithQuery(<LookupReservationPage />, '/tra-cuu')

    await user.type(screen.getByLabelText(/Mã đặt bàn/i), 'VD-7K3Q')
    await user.type(screen.getByLabelText(/Số điện thoại/i), '0999999999')
    await user.click(screen.getByRole('button', { name: /Tra cứu đặt bàn/i }))

    expect(
      await screen.findByText(/Không tìm thấy thông tin đặt bàn khớp/i)
    ).toBeInTheDocument()

    // Enter correct phone for VD-7K3Q (seeded 1.5h ahead -> < 4h)
    const phoneInput = screen.getByLabelText(/Số điện thoại/i)
    await user.clear(phoneInput)
    await user.type(phoneInput, '0901 234 567')
    await user.click(screen.getByRole('button', { name: /Tra cứu đặt bàn/i }))

    expect(await screen.findByText('VD-7K3Q')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Hủy đặt bàn này/i }))

    expect(
      await screen.findByText(/Cảnh báo chính sách hủy/i)
    ).toBeInTheDocument()
    await user.type(screen.getByLabelText(/Lý do hủy/i), 'Bận việc đột xuất')
    await user.click(
      screen.getByRole('button', { name: /Đồng ý hủy \(không hoàn cọc\)/i })
    )

    expect(
      await screen.findByText(/Đã hủy · không hoàn cọc/i)
    ).toBeInTheDocument()
  })

  it('grants 100% refund when cancelling a >= 4h booking', async () => {
    const user = userEvent.setup()
    const tomorrowIso = new Date(Date.now() + 24 * 3_600_000).toISOString()

    const created = await apiClient.post('/reservations', {
      tableId: 'tbl-b06',
      reservationTime: tomorrowIso,
      partySize: 4,
      preOrderedTastingMenuId: 'set-thuong-hang',
      fullName: 'Nguyễn Văn An',
      phoneNumber: '0901 234 567',
      email: 'an.nguyen@email.com',
    })
    const code = created.data.reservation.bookingCode as string
    await apiClient.post('/payments/vnpay-ipn', {
      bookingCode: code,
      transactionId: 'VNP-TEST-4H',
      paymentMethod: 'VietQR',
      responseCode: '00',
    })

    renderWithQuery(<LookupReservationPage />, '/tra-cuu')
    await user.type(screen.getByLabelText(/Mã đặt bàn/i), code)
    await user.type(screen.getByLabelText(/Số điện thoại/i), '0901234567')
    await user.click(screen.getByRole('button', { name: /Tra cứu đặt bàn/i }))

    expect(await screen.findByText(code)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Hủy đặt bàn này/i }))

    expect(
      await screen.findByText(/Xác nhận hủy đặt bàn & hoàn cọc 100%/i)
    ).toBeInTheDocument()
    await user.type(screen.getByLabelText(/Lý do hủy/i), 'Thay đổi kế hoạch')
    await user.click(
      screen.getByRole('button', { name: /Xác nhận hủy & hoàn cọc/i })
    )

    expect(
      await screen.findByText(/Đã hủy · đã hoàn cọc/i)
    ).toBeInTheDocument()
  })

  it('shows "Đã nhận bàn" badge and no cancel button for a CheckedIn booking', async () => {
    const user = userEvent.setup()
    renderWithQuery(<LookupReservationPage />, '/tra-cuu')

    await user.type(screen.getByLabelText(/Mã đặt bàn/i), 'VD-4M2P')
    await user.type(screen.getByLabelText(/Số điện thoại/i), '0901 234 567')
    await user.click(screen.getByRole('button', { name: /Tra cứu đặt bàn/i }))

    expect(await screen.findByText('VD-4M2P')).toBeInTheDocument()
    expect(screen.getByText('Đã nhận bàn')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Hủy đặt bàn này/i })
    ).not.toBeInTheDocument()
  })
})

describe('G3 EMenu double-send guard', () => {
  beforeEach(() => {
    installMockAdapter(apiClient, { minLatencyMs: 0, maxLatencyMs: 0 })
    resetMockDb()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    cleanup()
  })

  it('prevents duplicate service call requests while pending or already sent', async () => {
    const user = userEvent.setup()
    let resolveCall!: (value: Awaited<ReturnType<typeof menuApi.callService>>) => void
    const spy = vi.spyOn(menuApi, 'callService').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCall = resolve
        })
    )

    renderWithQuery(
      <Routes>
        <Route path="/menu/:qrCode" element={<EMenuPage />} />
      </Routes>,
      '/menu/VD-QR-B03'
    )

    const waterBtn = await screen.findByRole('button', { name: /Châm nước/i })
    await user.click(waterBtn)
    await user.click(waterBtn)

    expect(spy).toHaveBeenCalledTimes(1)

    resolveCall({
      id: 'sr-test',
      tableId: 'tbl-b03',
      tableNumber: 'B03',
      requestType: 'RefillWater',
      status: 'Pending',
      completedById: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
    })

    await waitFor(() => {
      expect(
        screen.getByText(/Đã gửi yêu cầu: Châm nước/i)
      ).toBeInTheDocument()
    })
    const sentBtn = screen.getByRole('button', { name: /Đã gửi · Châm nước/i })
    expect(sentBtn).toBeDisabled()
    await user.click(sentBtn)
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
