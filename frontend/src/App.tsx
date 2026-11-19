import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Skeleton, ThemeToggle, ToastViewport, Wordmark } from '@/components/ui'
import {
  GuestLayout,
  StaffDesktopLayout,
  StaffMobileLayout,
  StaffTabletLayout,
  WallLayout,
} from '@/layouts'
import { isMockMode } from '@/lib/utils'
import { useThemeArea } from '@/stores/useThemeStore'

const HomePage = lazy(() =>
  import('@/pages/guest/HomePage').then((m) => ({ default: m.HomePage }))
)
const BookingPage = lazy(() =>
  import('@/pages/guest/BookingPage').then((m) => ({ default: m.BookingPage }))
)
const VnPayMockPage = lazy(() =>
  import('@/pages/guest/VnPayMockPage').then((m) => ({
    default: m.VnPayMockPage,
  }))
)
const LookupReservationPage = lazy(() =>
  import('@/pages/guest/LookupReservationPage').then((m) => ({
    default: m.LookupReservationPage,
  }))
)
const EMenuPage = lazy(() =>
  import('@/pages/guest/EMenuPage').then((m) => ({ default: m.EMenuPage }))
)
const FeedbackPage = lazy(() =>
  import('@/pages/guest/FeedbackPage').then((m) => ({
    default: m.FeedbackPage,
  }))
)
const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
)
const UiGalleryPage = lazy(() =>
  import('@/pages/dev/UiGalleryPage').then((m) => ({
    default: m.UiGalleryPage,
  }))
)
const WaitstaffFloorPlanPage = lazy(() =>
  import('@/pages/staff/waitstaff/FloorPlanPage').then((m) => ({
    default: m.FloorPlanPage,
  }))
)
const WaitstaffCheckInLookupPage = lazy(() =>
  import('@/pages/staff/waitstaff/CheckInLookupPage').then((m) => ({
    default: m.CheckInLookupPage,
  }))
)
const WaitstaffTableDetailPage = lazy(() =>
  import('@/pages/staff/waitstaff/TableCheckInDetailPage').then((m) => ({
    default: m.TableCheckInDetailPage,
  }))
)
const WaitstaffCreateOrderPage = lazy(() =>
  import('@/pages/staff/waitstaff/CreateOrderPage').then((m) => ({
    default: m.CreateOrderPage,
  }))
)
const WaitstaffActiveOrderPage = lazy(() =>
  import('@/pages/staff/waitstaff/ActiveOrderPage').then((m) => ({
    default: m.ActiveOrderPage,
  }))
)
const WaitstaffAddItemsPage = lazy(() =>
  import('@/pages/staff/waitstaff/AddItemsPage').then((m) => ({
    default: m.AddItemsPage,
  }))
)
const WaitstaffTransferTablePage = lazy(() =>
  import('@/pages/staff/waitstaff/TransferTablePage').then((m) => ({
    default: m.TransferTablePage,
  }))
)
const CashierQueuePage = lazy(() =>
  import('@/pages/staff/cashier/CashierQueuePage').then((m) => ({
    default: m.CashierQueuePage,
  }))
)
const CashierCheckInPage = lazy(() =>
  import('@/pages/staff/cashier/CashierCheckInPage').then((m) => ({
    default: m.CashierCheckInPage,
  }))
)
const InvoicePreviewPage = lazy(() =>
  import('@/pages/staff/cashier/InvoicePreviewPage').then((m) => ({
    default: m.InvoicePreviewPage,
  }))
)
const InvoicesTodayPage = lazy(() =>
  import('@/pages/staff/cashier/InvoicesTodayPage').then((m) => ({
    default: m.InvoicesTodayPage,
  }))
)
const WaitstaffNotificationsPage = lazy(() =>
  import('@/pages/staff/waitstaff/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  }))
)
const ExpediterPassPage = lazy(() =>
  import('@/pages/staff/expediter/ExpediterPassPage').then((m) => ({
    default: m.ExpediterPassPage,
  }))
)
const KdsBoardPage = lazy(() =>
  import('@/pages/kds/KdsBoardPage').then((m) => ({
    default: m.KdsBoardPage,
  }))
)
const ManagerMenuPage = lazy(() =>
  import('@/pages/staff/manager/ManagerMenuPage').then((m) => ({
    default: m.ManagerMenuPage,
  }))
)
const ManagerFloorPlanPage = lazy(() =>
  import('@/pages/staff/manager/ManagerFloorPlanPage').then((m) => ({
    default: m.ManagerFloorPlanPage,
  }))
)
const ManagerRefundsPage = lazy(() =>
  import('@/pages/staff/manager/ManagerRefundsPage').then((m) => ({
    default: m.ManagerRefundsPage,
  }))
)
const ManagerStaffPage = lazy(() =>
  import('@/pages/staff/manager/ManagerStaffPage').then((m) => ({
    default: m.ManagerStaffPage,
  }))
)
const ManagerReportsPage = lazy(() =>
  import('@/pages/staff/manager/ManagerReportsPage').then((m) => ({
    default: m.ManagerReportsPage,
  }))
)

function PageFallback() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}

function QrMenuShell() {
  useThemeArea('guest')
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col">
      <header className="border-b border-line bg-surface/90 backdrop-blur-md">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Wordmark size="sm" />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1">
        <EMenuPage />
      </main>
    </div>
  )
}

export default function App() {
  const mockEnabled = isMockMode()

  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Guest Public Website */}
          <Route element={<GuestLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/dat-ban" element={<BookingPage />} />
            <Route path="/thanh-toan/vnpay/:code" element={<VnPayMockPage />} />
            <Route path="/tra-cuu" element={<LookupReservationPage />} />
            <Route path="/danh-gia/:token" element={<FeedbackPage />} />
          </Route>

          {/* Guest Table QR E-Menu (phone-first view-only) */}
          <Route path="/menu/:qrCode" element={<QrMenuShell />} />

          {/* Staff Login */}
          <Route path="/dang-nhap" element={<LoginPage />} />

          {/* KDS Bếp (Wall display, no login) */}
          <Route element={<WallLayout />}>
            <Route path="/kds" element={<KdsBoardPage />} />
          </Route>

          {/* Waitstaff (Mobile POS) */}
          <Route
            element={<ProtectedRoute allowedRoles={['Waitstaff', 'Manager']} />}
          >
            <Route path="/phuc-vu" element={<StaffMobileLayout />}>
              <Route index element={<WaitstaffFloorPlanPage />} />
              <Route path="check-in" element={<WaitstaffCheckInLookupPage />} />
              <Route path="ban/:tableId" element={<WaitstaffTableDetailPage />} />
              <Route
                path="tao-order/:tableId"
                element={<WaitstaffCreateOrderPage />}
              />
              <Route
                path="order/:tableId"
                element={<WaitstaffActiveOrderPage />}
              />
              <Route
                path="goi-them/:tableId"
                element={<WaitstaffAddItemsPage />}
              />
              <Route
                path="doi-ban/:tableId"
                element={<WaitstaffTransferTablePage />}
              />
              <Route
                path="thong-bao"
                element={<WaitstaffNotificationsPage />}
              />
            </Route>
          </Route>

          {/* Expediter (Pass Tablet) */}
          <Route
            element={<ProtectedRoute allowedRoles={['Expediter', 'Manager']} />}
          >
            <Route path="/dieu-phoi" element={<StaffTabletLayout />}>
              <Route index element={<ExpediterPassPage />} />
            </Route>
          </Route>

          {/* Cashier (Desktop POS) */}
          <Route
            element={<ProtectedRoute allowedRoles={['Cashier', 'Manager']} />}
          >
            <Route
              path="/thu-ngan"
              element={<StaffDesktopLayout area="cashier" />}
            >
              <Route index element={<CashierQueuePage />} />
              <Route path="check-in" element={<CashierCheckInPage />} />
              <Route
                path="tam-tinh/:tableId"
                element={<InvoicePreviewPage />}
              />
              <Route path="hoa-don" element={<InvoicesTodayPage />} />
            </Route>
          </Route>

          {/* Manager (Desktop Backoffice) */}
          <Route element={<ProtectedRoute allowedRoles={['Manager']} />}>
            <Route
              path="/quan-ly"
              element={<StaffDesktopLayout area="manager" />}
            >
              <Route index element={<ManagerMenuPage />} />
              <Route path="so-do-ban" element={<ManagerFloorPlanPage />} />
              <Route path="hoan-coc" element={<ManagerRefundsPage />} />
              <Route path="tai-khoan" element={<ManagerStaffPage />} />
              <Route path="bao-cao" element={<ManagerReportsPage />} />
            </Route>
          </Route>

          {/* Dev-only UI Gallery */}
          {mockEnabled && <Route path="/dev/ui" element={<UiGalleryPage />} />}

          {/* Legacy skeleton route aliases */}
          <Route path="/reserve" element={<Navigate to="/dat-ban" replace />} />
          <Route path="/menu" element={<Navigate to="/menu/VD-QR-B03" replace />} />
          <Route path="/login" element={<Navigate to="/dang-nhap" replace />} />
          <Route path="/pos" element={<Navigate to="/phuc-vu" replace />} />
          <Route path="/pos/tables" element={<Navigate to="/phuc-vu" replace />} />
          <Route
            path="/pos/order/:tableId"
            element={<Navigate to="/phuc-vu" replace />}
          />
          <Route
            path="/expediter"
            element={<Navigate to="/dieu-phoi" replace />}
          />
          <Route
            path="/cashier"
            element={<Navigate to="/thu-ngan" replace />}
          />
          <Route
            path="/manager"
            element={<Navigate to="/quan-ly" replace />}
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <ToastViewport />
    </BrowserRouter>
  )
}
