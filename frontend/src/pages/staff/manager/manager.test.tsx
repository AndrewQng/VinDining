// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient, authApi, managerApi } from '@/services/api'
import { installMockAdapter, resetMockDb } from '@/services/mock'
import { useAuthStore } from '@/stores/useAuthStore'
import { ManagerFloorPlanPage } from './ManagerFloorPlanPage'
import { ManagerMenuPage } from './ManagerMenuPage'
import { ManagerRefundsPage } from './ManagerRefundsPage'
import { ManagerReportsPage } from './ManagerReportsPage'
import { ManagerStaffPage } from './ManagerStaffPage'

const activeClients: QueryClient[] = []

function renderManagerRoute(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  activeClients.push(queryClient)
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/quan-ly" element={<ManagerMenuPage />} />
          <Route path="/quan-ly/so-do-ban" element={<ManagerFloorPlanPage />} />
          <Route path="/quan-ly/hoan-coc" element={<ManagerRefundsPage />} />
          <Route path="/quan-ly/tai-khoan" element={<ManagerStaffPage />} />
          <Route path="/quan-ly/bao-cao" element={<ManagerReportsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Manager M1–M5 backoffice components', () => {
  beforeEach(async () => {
    installMockAdapter(apiClient, { minLatencyMs: 0, maxLatencyMs: 0 })
    resetMockDb()
    const res = await authApi.login({
      username: 'long.dh',
      password: 'VinDining@2026',
    })
    useAuthStore.getState().setAuth(res.token, res.user)
  })

  afterEach(async () => {
    await Promise.all(
      activeClients.splice(0).map(async (qc) => {
        await qc.cancelQueries()
        qc.clear()
      })
    )
    useAuthStore.getState().logout()
    cleanup()
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('M1 handles availability toggle and duplicate dish name error', async () => {
    const user = userEvent.setup()
    renderManagerRoute('/quan-ly')

    const toggle = await screen.findByRole('switch', {
      name: /Trạng thái Gỏi tôm hùm sốt chanh leo/i,
    })
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    await user.click(toggle)
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'false'))

    await user.click(screen.getByRole('button', { name: /Thêm món mới/i }))
    await user.type(
      screen.getByLabelText('Tên món'),
      'Súp bào ngư thượng hạng'
    )
    await user.type(screen.getByLabelText(/Đơn giá/i), '300000')
    await user.click(screen.getByRole('button', { name: /Lưu món mới/i }))

    expect(
      await screen.findByText(/Tên món ăn đã tồn tại trong thực đơn/i)
    ).toBeInTheDocument()
  })

  it('M2 moves selected table with arrow key, saves layout payload, and refuses deleting Occupied table', async () => {
    const user = userEvent.setup()
    const saveSpy = vi.spyOn(managerApi, 'saveFloorPlanLayout')
    renderManagerRoute('/quan-ly/so-do-ban')

    const nodeB06 = await screen.findByTestId('floor-node-B06')
    nodeB06.focus()
    await user.keyboard('{ArrowRight}')
    await user.click(screen.getByRole('button', { name: /Lưu sơ đồ/i }))
    await waitFor(() => expect(saveSpy).toHaveBeenCalledTimes(1))

    await user.click(screen.getByTestId('floor-node-B03'))
    await user.click(screen.getByRole('button', { name: /Xóa bàn B03/i }))
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: /Xác nhận xóa/i,
      })
    )
    expect(await screen.findByTestId('m2x-delete-error')).toHaveTextContent(
      /chuyển khách trước khi xóa/i
    )
  })

  it('M3 approves and rejects exception refund requests with mandatory audit reason', async () => {
    const user = userEvent.setup()
    renderManagerRoute('/quan-ly/hoan-coc')

    const row = await screen.findByTestId('refund-row-VD-2C8N')
    await user.click(row.querySelector('button')!)

    await user.click(
      screen.getByRole('button', { name: /Chấp thuận hoàn cọc/i })
    )
    expect(
      await screen.findByText(/Vui lòng nhập lý do phê duyệt hoặc từ chối/i)
    ).toBeInTheDocument()

    await user.type(
      screen.getByLabelText(/Lý do xử lý của Quản lý/i),
      'Khách có lý do bất khả kháng hợp lệ'
    )
    await user.click(
      screen.getByRole('button', { name: /Chấp thuận hoàn cọc/i })
    )
    expect(
      await screen.findByTestId('refund-decision-status')
    ).toHaveTextContent(/Đã hoàn tiền cọc qua VNPAY/i)
  })

  it('M4 disables self-lock and creates Cashier account with mock temporary password note', async () => {
    const user = userEvent.setup()
    renderManagerRoute('/quan-ly/tai-khoan')

    const selfRow = await screen.findByTestId('staff-row-long.dh')
    expect(
      selfRow.querySelector('button[title*="Không thể tự khóa"]')
    ).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /Tạo tài khoản/i }))
    await user.type(screen.getByLabelText('Họ và tên'), 'Trần Hải Yến')
    await user.type(screen.getByLabelText('Tên đăng nhập'), 'yen.th')
    await user.type(screen.getByLabelText('Email'), 'yen.th@vindining.vn')
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: /Tạo tài khoản/i,
      })
    )

    expect(
      await screen.findByTestId('staff-credential-banner')
    ).toHaveTextContent(
      'Đã gửi thông tin đăng nhập ban đầu đến email yen.th@vindining.vn'
    )
    expect(screen.getByTestId('mock-temp-password')).toHaveTextContent(
      'VinDining@2026'
    )
  })

  it('M5 renders historical KPIs, feedback block, and M5x empty state for future period', async () => {
    const user = userEvent.setup()
    renderManagerRoute('/quan-ly/bao-cao')

    expect(await screen.findByTestId('kpi-total-revenue')).not.toHaveTextContent(
      /^0 ₫$/
    )
    expect(screen.getByText(/Chất lượng dịch vụ & đánh giá khách hàng/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Kỳ sau' }))
    expect(await screen.findByTestId('m5x-empty-report')).toHaveTextContent(
      'Không có số liệu trong khoảng thời gian này'
    )
  })
})
