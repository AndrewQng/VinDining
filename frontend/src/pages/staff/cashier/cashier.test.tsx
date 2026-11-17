// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isCashierBellMuted, setCashierBellMuted } from '@/lib/bellSound'
import { apiClient, authApi, invoiceApi, orderApi, tableApi } from '@/services/api'
import { installMockAdapter, resetMockDb } from '@/services/mock'
import { useAuthStore } from '@/stores/useAuthStore'
import { CashierCheckInPage } from './CashierCheckInPage'
import { CashierQueuePage } from './CashierQueuePage'
import { InvoicePreviewPage } from './InvoicePreviewPage'
import { InvoicesTodayPage } from './InvoicesTodayPage'

function renderCashierRoute(initialEntry: string) {
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
            <Route path="/thu-ngan" element={<CashierQueuePage />} />
            <Route
              path="/thu-ngan/tam-tinh/:tableId"
              element={<InvoicePreviewPage />}
            />
            <Route path="/thu-ngan/check-in" element={<CashierCheckInPage />} />
            <Route path="/thu-ngan/hoa-don" element={<InvoicesTodayPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  }
}

describe('Cashier C1–C4 & Hóa đơn hôm nay components', () => {
  beforeEach(async () => {
    installMockAdapter(apiClient)
    resetMockDb()
    setCashierBellMuted(false)
    const res = await authApi.login({
      username: 'ha.pt',
      password: 'VinDining@2026',
    })
    useAuthStore.getState().setAuth(res.token, res.user)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('C1 renders PaymentPending queue, Occupied tab, toggles bell mute, and highlights live checkout:requested', async () => {
    const user = userEvent.setup()
    renderCashierRoute('/thu-ngan')

    expect(await screen.findByTestId('queue-row-B04')).toBeInTheDocument()

    // Mute toggle persists in localStorage
    const muteBtn = screen.getByRole('button', { name: /Chuông báo:/i })
    await user.click(muteBtn)
    expect(isCashierBellMuted()).toBe(true)
    expect(screen.getByRole('button', { name: /Chuông báo: Tắt/i })).toBeInTheDocument()

    // Switch to Đang phục vụ tab first to verify Occupied tables are listed
    await user.click(screen.getByRole('tab', { name: /Đang phục vụ/i }))
    expect(await screen.findByTestId('queue-row-B03')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /Chờ thanh toán/i }))

    // Trigger checkout request as Waitstaff -> Cashier queue highlights B03 live
    const waiterRes = await authApi.login({
      username: 'mai.tt',
      password: 'VinDining@2026',
    })
    useAuthStore.getState().setAuth(waiterRes.token, waiterRes.user)
    await invoiceApi.requestCheckout('tbl-b03')
    const cashierRes = await authApi.login({
      username: 'ha.pt',
      password: 'VinDining@2026',
    })
    useAuthStore.getState().setAuth(cashierRes.token, cashierRes.user)

    expect(
      await screen.findByText(/Bàn B03 vừa yêu cầu tính tiền/i)
    ).toBeInTheDocument()
    expect(await screen.findByTestId('queue-row-B03')).toBeInTheDocument()
  })

  it('C2x displays B04 below-deposit totals (0 ₫ due) with minimum spend rule note', async () => {
    renderCashierRoute('/thu-ngan/tam-tinh/tbl-b04')

    expect(
      await screen.findByRole('heading', { name: /Phiếu tạm tính · Bàn B04/i })
    ).toBeInTheDocument()
    expect(screen.getByTestId('amount-due-box')).toHaveTextContent('0 ₫')
    expect(screen.getByTestId('minimum-spend-note')).toHaveTextContent(
      'Tiền cọc là mức chi tiêu tối thiểu, không hoàn lại phần chênh lệch.'
    )
  })

  it('C2, C2p & C3/C3b group B05 Set Menu into one line, open 80mm VietQR slip, and prevent double settle', async () => {
    const user = userEvent.setup()

    // Prepare B05 with all 3 courses served
    const waiterRes = await authApi.login({
      username: 'mai.tt',
      password: 'VinDining@2026',
    })
    useAuthStore.getState().setAuth(waiterRes.token, waiterRes.user)
    const { order } = await tableApi.checkIn('tbl-b05', {
      reservationCode: 'VD-7K3Q',
    })
    await orderApi.activateCourse(order!.id, { courseType: 'MainCourse' })
    await orderApi.activateCourse(order!.id, { courseType: 'Dessert' })

    const expRes = await authApi.login({
      username: 'quan.lm',
      password: 'VinDining@2026',
    })
    useAuthStore.getState().setAuth(expRes.token, expRes.user)
    for (const item of order!.items) {
      await orderApi.serveItem(order!.id, item.id)
    }

    const cashierRes = await authApi.login({
      username: 'ha.pt',
      password: 'VinDining@2026',
    })
    useAuthStore.getState().setAuth(cashierRes.token, cashierRes.user)

    const printSpy = vi.spyOn(invoiceApi, 'printPreview')
    const settleSpy = vi.spyOn(invoiceApi, 'settle')

    renderCashierRoute('/thu-ngan/tam-tinh/tbl-b05')

    expect(
      await screen.findByText(/Set Menu Thượng Hạng × 4/i)
    ).toBeInTheDocument()
    expect(screen.getByTestId('amount-due-box')).toHaveTextContent('6.156.000 ₫')

    // C2p 80mm preview
    await user.click(
      screen.getByRole('button', { name: /In phiếu tạm tính \(80mm\)/i })
    )
    expect(printSpy).toHaveBeenCalledWith('tbl-b05')
    expect(await screen.findByTestId('receipt-slip-80mm')).toHaveTextContent(
      'PHIẾU TẠM TÍNH'
    )
    expect(screen.getByTestId('receipt-slip-80mm')).toHaveTextContent(
      'Quét mã để thanh toán'
    )

    // C3 payment -> C3b settled
    await user.click(
      screen.getByRole('button', { name: /Đã in → Tiếp tục thanh toán/i })
    )
    await user.click(screen.getByRole('radio', { name: /Thẻ/i }))
    await user.click(
      screen.getByRole('button', { name: /Xác nhận hoàn tất thanh toán/i })
    )

    await waitFor(() => expect(settleSpy).toHaveBeenCalledTimes(1))
    expect(
      await screen.findByText(/Thanh toán thành công/i)
    ).toBeInTheDocument()
    expect(screen.getByTestId('receipt-slip-80mm')).toHaveTextContent('HÓA ĐƠN')
    expect(screen.getByTestId('receipt-slip-80mm')).toHaveTextContent(
      'Quét mã để đánh giá'
    )
  })

  it('C4 check-in by phone and Hóa đơn hôm nay listing/reprint work cleanly', async () => {
    const user = userEvent.setup()
    renderCashierRoute('/thu-ngan/check-in')

    const input = await screen.findByLabelText(/Mã đặt bàn hoặc số điện thoại/i)
    await user.type(input, '0901 234 567')
    await user.click(screen.getByRole('button', { name: 'Tìm' }))

    expect(await screen.findByText(/Nguyễn Văn An/i)).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: /Check-in khách vào bàn B05/i })
    )
    expect(
      await screen.findByTestId('cashier-checkin-success')
    ).toHaveTextContent('Đã check-in Bàn B05')

    cleanup()
    renderCashierRoute('/thu-ngan/hoa-don')
    expect(
      await screen.findByRole('heading', { name: 'Hóa đơn hôm nay' })
    ).toBeInTheDocument()
    const viewButtons = await screen.findAllByRole('button', {
      name: /Xem \/ In lại/i,
    })
    expect(viewButtons.length).toBeGreaterThanOrEqual(2)
    await user.click(viewButtons[0])
    expect(await screen.findByTestId('receipt-slip-80mm')).toHaveTextContent(
      'Quét mã để đánh giá'
    )
  })
})
