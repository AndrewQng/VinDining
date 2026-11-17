import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { ArrowRightLeft, Lock, PlusCircle, Receipt } from 'lucide-react'
import {
  calculateInvoiceTotals,
  getCourseAggregateStatus,
  getNextActivatableCourse,
  hasAnyServedItem,
  isOrderLockedForTable,
} from '@/domain'
import {
  Button,
  Card,
  Modal,
  Money,
  PageHeader,
  Skeleton,
  StatusBadge,
} from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { invoiceApi, orderApi, tableApi } from '@/services/api'
import type { ApiErrorResponse, OrderDto, OrderItemDto } from '@/types'

interface CourseSectionGroup {
  key: 'Course1' | 'MainCourse' | 'Dessert'
  title: string
  items: OrderItemDto[]
}

function groupOrderByCourse(order: OrderDto): CourseSectionGroup[] {
  const groups: CourseSectionGroup[] = [
    {
      key: 'Course1',
      title: 'Course 1 — Khai vị & Đồ uống',
      items: order.items.filter(
        (i) => i.courseType === 'Appetizer' || i.courseType === 'Beverage'
      ),
    },
    {
      key: 'MainCourse',
      title: 'Course 2 — Món chính',
      items: order.items.filter((i) => i.courseType === 'MainCourse'),
    },
    {
      key: 'Dessert',
      title: 'Course 3 — Tráng miệng',
      items: order.items.filter((i) => i.courseType === 'Dessert'),
    },
  ]
  return groups.filter((g) => g.items.length > 0)
}

/** W5, W5f, W5b, W8, W8b, W8x — Active order view with Course activation and checkout request. */
export function ActiveOrderPage() {
  useDocumentTitle('Order đang phục vụ')
  const { tableId = '' } = useParams<{ tableId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [courseToActivate, setCourseToActivate] = useState<
    'MainCourse' | 'Dessert' | null
  >(null)
  const [checkoutConfirmOpen, setCheckoutConfirmOpen] = useState(false)
  const [checkoutBlockedOpen, setCheckoutBlockedOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['table', tableId],
    queryFn: () => tableApi.getById(tableId),
    enabled: Boolean(tableId),
  })

  const activateCourseMutation = useMutation({
    mutationFn: ({
      orderId,
      courseType,
    }: {
      orderId: string
      courseType: 'MainCourse' | 'Dessert'
    }) => orderApi.activateCourse(orderId, { courseType }),
    onSuccess: () => {
      setCourseToActivate(null)
      setActionError(null)
      void queryClient.invalidateQueries({ queryKey: ['table', tableId] })
      void queryClient.invalidateQueries({ queryKey: ['tables'] })
    },
    onError: (err) => {
      setCourseToActivate(null)
      if (isAxiosError<ApiErrorResponse>(err)) {
        setActionError(
          err.response?.data?.message ?? 'Không thể kích hoạt Course lúc này'
        )
      } else {
        setActionError('Không thể kết nối hệ thống')
      }
    },
  })

  const checkoutMutation = useMutation({
    mutationFn: () => invoiceApi.requestCheckout(tableId),
    onSuccess: () => {
      setCheckoutConfirmOpen(false)
      setActionError(null)
      void queryClient.invalidateQueries({ queryKey: ['table', tableId] })
      void queryClient.invalidateQueries({ queryKey: ['tables'] })
    },
    onError: (err) => {
      setCheckoutConfirmOpen(false)
      if (isAxiosError<ApiErrorResponse>(err)) {
        const msg = err.response?.data?.message ?? ''
        if (err.response?.status === 409 && msg.includes('chưa có món')) {
          setCheckoutBlockedOpen(true)
          return
        }
        setActionError(msg || 'Không thể gửi yêu cầu tính tiền')
      } else {
        setActionError('Không thể kết nối hệ thống')
      }
    },
  })

  const order = data?.activeOrder ?? null
  const table = data?.table ?? null
  const reservation = data?.activeReservation ?? null

  const courseGroups = useMemo(
    () => (order ? groupOrderByCourse(order) : []),
    [order]
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (isError || !table) {
    return (
      <div className="space-y-4">
        <PageHeader title="Order đang phục vụ" backTo="/phuc-vu" />
        <Card className="space-y-3 text-center py-6">
          <p className="text-sm text-danger">Không thể tải thông tin order.</p>
          <Button
            size="sm"
            variant="secondary"
            className="min-h-[44px]"
            onClick={() => refetch()}
          >
            Thử lại
          </Button>
        </Card>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <PageHeader title={`Bàn ${table.tableNumber}`} backTo="/phuc-vu" />
        <Card className="space-y-3">
          <p className="text-sm text-ink-muted">
            Bàn {table.tableNumber} chưa có order đang hoạt động.
          </p>
          <Button
            variant="primary"
            className="w-full min-h-[44px]"
            onClick={() =>
              navigate(`/phuc-vu/tao-order/${encodeURIComponent(table.id)}`)
            }
          >
            Tạo Order
          </Button>
        </Card>
      </div>
    )
  }

  const isLocked = isOrderLockedForTable(table.status)
  const nextCourse = isLocked ? null : getNextActivatableCourse(order.items)
  const paidDeposit =
    reservation?.deposit?.status === 'Paid' ? reservation.deposit.amount : 0
  const invoiceTotals = calculateInvoiceTotals(order.items, paidDeposit)
  const canRequestCheckout = !isLocked && hasAnyServedItem(order.items)

  const nextCourseLabel =
    nextCourse === 'MainCourse'
      ? 'Kích hoạt Course 2'
      : nextCourse === 'Dessert'
        ? 'Kích hoạt Course 3'
        : null

  const activateTargetTitle =
    courseToActivate === 'MainCourse'
      ? 'Course 2 — Món chính'
      : 'Course 3 — Tráng miệng'
  const activateTargetItems = order.items.filter(
    (i) => i.courseType === courseToActivate && i.status === 'OnHold'
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title={
          isLocked
            ? `Bàn ${table.tableNumber} · Chờ thanh toán`
            : `Bàn ${table.tableNumber} · Order đang phục vụ`
        }
        backTo="/phuc-vu"
      />

      {actionError && (
        <div
          role="alert"
          className="rounded-xl border border-danger/50 bg-danger/10 px-3.5 py-2.5 text-xs text-danger"
        >
          {actionError}
        </div>
      )}

      {isLocked && (
        <Card className="space-y-3 border-primary/60">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-ink">
              Bàn {table.tableNumber} ({order.guestCount} khách)
            </span>
            <StatusBadge status="PaymentPending" />
          </div>

          <p className="text-sm font-semibold text-success">
            Đã gửi yêu cầu tính tiền về quầy thu ngân.
          </p>

          <p className="text-xs font-semibold text-accent">
            Tổng tạm tính: <Money amount={invoiceTotals.amountDue} />
            {paidDeposit > 0 && (
              <>
                {' '}
                (đã trừ cọc <Money amount={paidDeposit} />)
              </>
            )}
          </p>

          <div className="rounded-lg bg-card border border-line px-3 py-2.5 flex items-start gap-2 text-xs text-ink-muted">
            <Lock className="w-4 h-4 shrink-0 mt-0.5 text-warning" aria-hidden="true" />
            <span>
              Order đã khóa — không thể gọi thêm món khi bàn chờ thanh toán.
            </span>
          </div>

          <Link to="/phuc-vu" className="block">
            <Button variant="primary" className="w-full min-h-[44px]">
              Về sơ đồ bàn
            </Button>
          </Link>
        </Card>
      )}

      <Card className="space-y-4">
        {courseGroups.map((group) => {
          const aggregateStatus = getCourseAggregateStatus(group.items)
          return (
            <section
              key={group.key}
              className="space-y-2 border-b border-line pb-3 last:border-b-0 last:pb-0"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wide text-accent">
                  {group.title}
                </h2>
                <StatusBadge status={aggregateStatus} />
              </div>

              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="text-ink font-medium">
                        {item.quantity}× {item.itemName}
                      </p>
                      {item.note && (
                        <p className="text-ink-muted text-[11px]">
                          Ghi chú: {item.note}
                        </p>
                      )}
                    </div>
                    <StatusBadge
                      status={item.status}
                      isRemake={item.isRemake}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </Card>

      {!isLocked && (
        <div className="space-y-2.5">
          {nextCourse && nextCourseLabel && (
            <Button
              type="button"
              variant="primary"
              className="w-full min-h-[44px]"
              onClick={() => setCourseToActivate(nextCourse)}
            >
              {nextCourseLabel}
            </Button>
          )}

          <Button
            type="button"
            variant="secondary"
            className="w-full min-h-[44px]"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={() =>
              navigate(`/phuc-vu/goi-them/${encodeURIComponent(table.id)}`)
            }
          >
            Gọi thêm món
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="w-full min-h-[44px]"
            icon={<ArrowRightLeft className="w-4 h-4" />}
            onClick={() =>
              navigate(`/phuc-vu/doi-ban/${encodeURIComponent(table.id)}`)
            }
          >
            Đổi bàn
          </Button>

          <Button
            type="button"
            variant="danger"
            className="w-full min-h-[44px]"
            icon={<Receipt className="w-4 h-4" />}
            onClick={() => {
              if (canRequestCheckout) {
                setCheckoutConfirmOpen(true)
              } else {
                setCheckoutBlockedOpen(true)
              }
            }}
          >
            Yêu cầu tính tiền
          </Button>
        </div>
      )}

      <Modal
        open={Boolean(courseToActivate)}
        onClose={() => setCourseToActivate(null)}
        title="Kích hoạt nấu món"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              className="min-h-[44px]"
              onClick={() => setCourseToActivate(null)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              className="min-h-[44px]"
              loading={activateCourseMutation.isPending}
              onClick={() =>
                courseToActivate &&
                activateCourseMutation.mutate({
                  orderId: order.id,
                  courseType: courseToActivate,
                })
              }
            >
              Kích hoạt nấu
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-sm text-ink-muted">
          <p>
            Kích hoạt nấu <strong className="text-ink">{activateTargetTitle}</strong>{' '}
            cho Bàn {table.tableNumber}?
          </p>
          {activateTargetItems.length > 0 && (
            <p className="text-xs text-ink">
              {activateTargetItems
                .map((i) => `${i.quantity}× ${i.itemName}`)
                .join(', ')}
            </p>
          )}
        </div>
      </Modal>

      <Modal
        open={checkoutConfirmOpen}
        onClose={() => setCheckoutConfirmOpen(false)}
        title="Yêu cầu tính tiền"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              className="min-h-[44px]"
              onClick={() => setCheckoutConfirmOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              className="min-h-[44px]"
              loading={checkoutMutation.isPending}
              onClick={() => checkoutMutation.mutate()}
            >
              Gửi yêu cầu
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          Gửi yêu cầu tính tiền bàn {table.tableNumber} về quầy thu ngân? Sau khi
          gửi, bàn sẽ chuyển trạng thái Chờ thanh toán và khóa order.
        </p>
      </Modal>

      <Modal
        open={checkoutBlockedOpen}
        onClose={() => setCheckoutBlockedOpen(false)}
        title="Chưa thể tính tiền"
        size="sm"
        footer={
          <Button
            variant="primary"
            className="w-full min-h-[44px]"
            onClick={() => setCheckoutBlockedOpen(false)}
          >
            Đóng
          </Button>
        }
      >
        <p className="text-sm text-ink-muted">
          Bàn chưa có món nào được phục vụ — không thể gửi yêu cầu tính tiền theo
          quy định.
        </p>
      </Modal>
    </div>
  )
}
