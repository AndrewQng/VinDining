import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Countdown,
  Drawer,
  EmptyState,
  Input,
  Modal,
  Money,
  NumberStepper,
  PageHeader,
  Select,
  Skeleton,
  StatusBadge,
  Tabs,
  Textarea,
  ThemeToggle,
  ThemedImage,
  Wordmark,
} from '@/components/ui'
import { useThemeArea } from '@/stores/useThemeStore'
import { toast } from '@/stores/useToastStore'
import type {
  MenuItemStatus,
  OrderItemStatus,
  OrderStatus,
  ReservationStatus,
  ServiceRequestStatus,
  TableStatus,
} from '@/types'

const TABLE_STATUSES: TableStatus[] = [
  'Available',
  'Locked',
  'Reserved',
  'Occupied',
  'PaymentPending',
  'Cleaning',
]

const ORDER_ITEM_STATUSES: OrderItemStatus[] = ['OnHold', 'Cooking', 'Served']

const RESERVATION_STATUSES: ReservationStatus[] = [
  'PendingDeposit',
  'Reserved',
  'CheckedIn',
  'Expired_Cancelled',
  'Cancelled_Refunded',
  'Cancelled_Forfeited',
  'RefundRejected',
]

const MENU_STATUSES: MenuItemStatus[] = ['Available', 'SoldOut']
const ORDER_STATUSES: OrderStatus[] = ['Active', 'Paid']
const SERVICE_STATUSES: ServiceRequestStatus[] = ['Pending', 'Completed']

/** Mock-mode component and status-badge gallery (/dev/ui). */
export function UiGalleryPage() {
  useThemeArea('staff')
  const [stepperVal, setStepperVal] = useState(4)
  const [activeTab, setActiveTab] = useState('tat-ca')
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [zone, setZone] = useState('MainHall')

  return (
    <div className="min-h-screen bg-bg text-ink">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <PageHeader
          title="Thư viện giao diện VinDining"
          backTo="/dang-nhap"
          backLabel="Về đăng nhập"
          actions={
            <div className="flex items-center gap-3">
              <Wordmark size="sm" />
              <ThemeToggle />
            </div>
          }
        />

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Nút bấm (Button)</CardTitle>
              <CardDescription>Các biến thể, kích thước và trạng thái tải</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2.5">
                <Button variant="primary">Xác nhận</Button>
                <Button variant="secondary">Hủy bỏ</Button>
                <Button variant="ghost">Chi tiết</Button>
                <Button variant="danger">Xóa bàn</Button>
                <Button variant="primary" disabled>
                  Không khả dụng
                </Button>
                <Button variant="primary" loading>
                  Đang xử lý
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <Button size="sm">Nhỏ (sm)</Button>
                <Button size="md">Vừa (md)</Button>
                <Button size="lg">Lớn (lg)</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tiền tệ, đếm ngược & ảnh theo giao diện</CardTitle>
              <CardDescription>Định dạng VND chuẩn và bộ đếm giữ chỗ 17 phút</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-xs text-ink-muted">Giá Set Menu</p>
                  <Money amount={1_800_000} tone="accent" className="text-lg" />
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Khấu trừ tiền cọc</p>
                  <Money amount={2_160_000} deduction tone="muted" className="text-lg" />
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Còn phải thanh toán</p>
                  <Money amount={6_156_000} className="text-lg font-semibold" />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <Countdown initialSeconds={17 * 60} tone="warning" />
                <Countdown initialSeconds={45} tone="danger" />
                <NumberStepper value={stepperVal} onChange={setStepperVal} min={1} max={12} />
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Huy hiệu trạng thái (StatusBadge)</CardTitle>
            <CardDescription>Toàn bộ trạng thái chuẩn trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-ink-muted">Trạng thái bàn</p>
              <div className="flex flex-wrap gap-2">
                {TABLE_STATUSES.map((s) => (
                  <StatusBadge key={s} status={s} domain="table" dot />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-ink-muted">Trạng thái món ăn</p>
              <div className="flex flex-wrap gap-2">
                {ORDER_ITEM_STATUSES.map((s) => (
                  <StatusBadge key={s} status={s} domain="orderItem" />
                ))}
                <StatusBadge status="Cooking" domain="orderItem" isRemake />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-ink-muted">Trạng thái đặt bàn</p>
              <div className="flex flex-wrap gap-2">
                {RESERVATION_STATUSES.map((s) => (
                  <StatusBadge key={s} status={s} domain="reservation" />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-ink-muted">Thực đơn · Đơn gọi món · Yêu cầu phục vụ</p>
              <div className="flex flex-wrap gap-2">
                {MENU_STATUSES.map((s) => (
                  <StatusBadge key={s} status={s} domain="menuItem" dot />
                ))}
                {ORDER_STATUSES.map((s) => (
                  <StatusBadge key={s} status={s} domain="order" />
                ))}
                {SERVICE_STATUSES.map((s) => (
                  <StatusBadge key={s} status={s} domain="service" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Trường nhập liệu (Input, Select, Textarea)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input label="Họ và tên" placeholder="Nguyễn Văn An" />
              <Input
                label="Số điện thoại"
                defaultValue="090123"
                error="Số điện thoại chưa hợp lệ"
              />
              <Select
                label="Khu vực"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                options={[
                  { value: 'MainHall', label: 'Sảnh chính' },
                  { value: 'VIP', label: 'VIP' },
                  { value: 'Balcony', label: 'Ban công' },
                ]}
              />
              <Textarea label="Ghi chú" placeholder="Ghi chú món ăn hoặc yêu cầu bàn..." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tabs, Modal, Drawer, Toast & Skeleton</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs
                value={activeTab}
                onChange={setActiveTab}
                items={[
                  { value: 'tat-ca', label: 'Tất cả', badge: 15 },
                  { value: 'sanh-chinh', label: 'Sảnh chính', badge: 8 },
                  { value: 'vip', label: 'VIP', badge: 3 },
                ]}
              />
              <div className="flex flex-wrap gap-2.5">
                <Button variant="secondary" onClick={() => setModalOpen(true)}>
                  Mở hộp thoại
                </Button>
                <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
                  Mở ngăn kéo
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => toast.success('Thông báo thành công', 'Dữ liệu đã được cập nhật.')}
                >
                  Hiện thông báo
                </Button>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
            <CardFooter>
              <ThemedImage
                name="set_thuong_hang.jpg"
                alt="Set Menu Thượng Hạng"
                className="w-20 h-14 object-cover rounded-lg border border-line"
              />
              <div className="text-xs text-ink-muted">
                Ảnh minh họa tự động đổi giữa thư mục dark / light theo giao diện.
              </div>
            </CardFooter>
          </Card>
        </section>

        <EmptyState
          title="Chưa có dữ liệu trong khoảng thời gian này"
          description="Mẫu trạng thái trống dùng chung cho danh sách và báo cáo."
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Xác nhận thao tác"
        description="Hộp thoại hỗ trợ Esc, khóa cuộn trang và bẫy tiêu điểm bàn phím."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Đóng
            </Button>
            <Button onClick={() => setModalOpen(false)}>Xác nhận</Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          Nội dung xác nhận mẫu cho thao tác quan trọng.
        </p>
      </Modal>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Ngăn kéo chi tiết"
        placement="bottom"
        footer={
          <Button onClick={() => setDrawerOpen(false)}>Hoàn tất</Button>
        }
      >
        <p className="text-sm text-ink-muted">
          Ngăn kéo trượt phục vụ giao diện điện thoại và danh sách thao tác nhanh.
        </p>
      </Drawer>
    </div>
  )
}
