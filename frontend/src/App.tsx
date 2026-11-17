import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ToastViewport } from '@/components/ui'
import {
  GuestLayout,
  StaffDesktopLayout,
  StaffMobileLayout,
  StaffTabletLayout,
  WallLayout,
} from '@/layouts'
import { isMockMode } from '@/lib/utils'
import { LoginPage } from '@/pages/LoginPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { UiGalleryPage } from '@/pages/dev/UiGalleryPage'

export default function App() {
  const mockEnabled = isMockMode()

  return (
    <BrowserRouter>
      <Routes>
        {/* Guest Public Website */}
        <Route element={<GuestLayout />}>
          <Route
            path="/"
            element={
              <PlaceholderPage
                title="Trang chủ VinDining"
                subtitle="Giới thiệu Set Menu, không gian và thực đơn à la carte"
              />
            }
          />
          <Route
            path="/dat-ban"
            element={
              <PlaceholderPage
                title="Đặt bàn & đặt cọc trực tuyến"
                subtitle="Chọn thời gian, khu vực, bàn ăn và Set Menu đặt trước"
              />
            }
          />
          <Route
            path="/tra-cuu"
            element={
              <PlaceholderPage
                title="Tra cứu & hủy đặt bàn"
                subtitle="Kiểm tra thông tin đặt bàn và chính sách hoàn cọc"
              />
            }
          />
          <Route
            path="/menu/:qrCode"
            element={
              <PlaceholderPage
                title="Thực đơn tại bàn (E-Menu)"
                subtitle="Xem thực đơn và gửi yêu cầu phục vụ tại bàn"
              />
            }
          />
          <Route
            path="/danh-gia/:token"
            element={
              <PlaceholderPage
                title="Đánh giá trải nghiệm"
                subtitle="Gửi đánh giá chất lượng món ăn, không gian và phục vụ"
              />
            }
          />
        </Route>

        {/* Staff Login */}
        <Route path="/dang-nhap" element={<LoginPage />} />

        {/* KDS Bếp (Wall display, no login) */}
        <Route element={<WallLayout />}>
          <Route
            path="/kds"
            element={
              <PlaceholderPage
                title="KDS Bếp"
                subtitle="Màn hình hiển thị vé món đang chế biến tại bếp"
              />
            }
          />
        </Route>

        {/* Waitstaff (Mobile POS) */}
        <Route element={<ProtectedRoute allowedRoles={['Waitstaff', 'Manager']} />}>
          <Route path="/phuc-vu" element={<StaffMobileLayout />}>
            <Route
              index
              element={
                <PlaceholderPage
                  title="Sơ đồ bàn"
                  subtitle="Theo dõi trạng thái bàn theo khu vực"
                />
              }
            />
            <Route
              path="check-in"
              element={
                <PlaceholderPage
                  title="Check-in nhận bàn"
                  subtitle="Tra cứu mã đặt bàn hoặc nhận khách trực tiếp"
                  backTo="/phuc-vu"
                />
              }
            />
            <Route
              path="order/:tableId"
              element={
                <PlaceholderPage
                  title="Order tại bàn"
                  subtitle="Tạo order, gọi thêm món, kích hoạt Course và yêu cầu tính tiền"
                  backTo="/phuc-vu"
                />
              }
            />
            <Route
              path="thong-bao"
              element={
                <PlaceholderPage
                  title="Thông báo phục vụ"
                  subtitle="Yêu cầu từ QR E-Menu và món sẵn sàng tại quầy Pass"
                />
              }
            />
          </Route>
        </Route>

        {/* Expediter (Pass Tablet) */}
        <Route element={<ProtectedRoute allowedRoles={['Expediter', 'Manager']} />}>
          <Route path="/dieu-phoi" element={<StaffTabletLayout />}>
            <Route
              index
              element={
                <PlaceholderPage
                  title="Quầy Pass"
                  subtitle="Kiểm soát đĩa món, xác nhận đi món hoặc yêu cầu làm lại"
                />
              }
            />
          </Route>
        </Route>

        {/* Cashier (Desktop POS) */}
        <Route element={<ProtectedRoute allowedRoles={['Cashier', 'Manager']} />}>
          <Route path="/thu-ngan" element={<StaffDesktopLayout area="cashier" />}>
            <Route
              index
              element={
                <PlaceholderPage
                  title="Hàng chờ thanh toán"
                  subtitle="Danh sách bàn đang chờ tạm tính và quyết toán"
                />
              }
            />
            <Route
              path="check-in"
              element={
                <PlaceholderPage
                  title="Check-in khách"
                  subtitle="Nhận khách đặt trước và khách đến trực tiếp tại quầy"
                />
              }
            />
            <Route
              path="tam-tinh/:tableId"
              element={
                <PlaceholderPage
                  title="Tạm tính & thanh toán"
                  subtitle="Kiểm tra phiếu tạm tính 80mm, cấn trừ cọc và xác nhận thanh toán"
                  backTo="/thu-ngan"
                />
              }
            />
          </Route>
        </Route>

        {/* Manager (Desktop Backoffice) */}
        <Route element={<ProtectedRoute allowedRoles={['Manager']} />}>
          <Route path="/quan-ly" element={<StaffDesktopLayout area="manager" />}>
            <Route
              index
              element={
                <PlaceholderPage
                  title="Quản lý thực đơn"
                  subtitle="Quản trị món lẻ, Prep SLA, trạng thái món và Set Menu"
                />
              }
            />
            <Route
              path="so-do-ban"
              element={
                <PlaceholderPage
                  title="Cấu hình sơ đồ bàn"
                  subtitle="Quản lý vị trí, sức chứa, khu vực và mã QR bàn"
                />
              }
            />
            <Route
              path="hoan-coc"
              element={
                <PlaceholderPage
                  title="Duyệt hoàn cọc ngoại lệ"
                  subtitle="Xem xét yêu cầu hủy đặt bàn và phê duyệt hoàn cọc"
                />
              }
            />
            <Route
              path="tai-khoan"
              element={
                <PlaceholderPage
                  title="Tài khoản nhân viên"
                  subtitle="Tạo tài khoản, phân quyền, đặt lại mật khẩu và khóa mở tài khoản"
                />
              }
            />
            <Route
              path="bao-cao"
              element={
                <PlaceholderPage
                  title="Báo cáo doanh thu & vận hành"
                  subtitle="Thống kê doanh thu, tỷ lệ lấp đầy, món bán chạy và xuất báo cáo"
                />
              }
            />
          </Route>
        </Route>

        {/* Dev-only UI Gallery */}
        {mockEnabled && <Route path="/dev/ui" element={<UiGalleryPage />} />}

        {/* Legacy skeleton route aliases */}
        <Route path="/reserve" element={<Navigate to="/dat-ban" replace />} />
        <Route path="/menu" element={<Navigate to="/menu/demo" replace />} />
        <Route path="/login" element={<Navigate to="/dang-nhap" replace />} />
        <Route path="/pos" element={<Navigate to="/phuc-vu" replace />} />
        <Route path="/pos/tables" element={<Navigate to="/phuc-vu" replace />} />
        <Route path="/pos/order/:tableId" element={<Navigate to="/phuc-vu" replace />} />
        <Route path="/expediter" element={<Navigate to="/dieu-phoi" replace />} />
        <Route path="/cashier" element={<Navigate to="/thu-ngan" replace />} />
        <Route path="/manager" element={<Navigate to="/quan-ly" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastViewport />
    </BrowserRouter>
  )
}
