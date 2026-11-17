import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Droplets,
  Utensils,
} from 'lucide-react'
import {
  Button,
  Card,
  Money,
  Skeleton,
  StatusBadge,
  ThemedImage,
} from '@/components/ui'
import { COURSE_TYPE_LABELS, SERVICE_REQUEST_TYPE_LABELS } from '@/domain'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { menuApi } from '@/services/api'
import { toast } from '@/stores/useToastStore'
import type {
  ApiErrorResponse,
  CourseType,
  ServiceRequestType,
} from '@/types'

const SERVICE_BUTTONS: {
  type: ServiceRequestType
  label: string
  icon: typeof Bell
}[] = [
  {
    type: 'CallStaff',
    label: SERVICE_REQUEST_TYPE_LABELS.CallStaff,
    icon: Bell,
  },
  {
    type: 'RefillWater',
    label: SERVICE_REQUEST_TYPE_LABELS.RefillWater,
    icon: Droplets,
  },
  {
    type: 'ChangeUtensils',
    label: SERVICE_REQUEST_TYPE_LABELS.ChangeUtensils,
    icon: Utensils,
  },
]

const FOOD_COURSE_ORDER: readonly CourseType[] = [
  'Appetizer',
  'MainCourse',
  'Dessert',
]

/** G3 — Phone-first view-only QR E-Menu with service request buttons (no cart/ordering). */
export function EMenuPage() {
  const { qrCode = '' } = useParams<{ qrCode: string }>()
  useDocumentTitle('Thực đơn tại bàn')

  const [pendingType, setPendingType] = useState<ServiceRequestType | null>(null)
  const [sentTypes, setSentTypes] = useState<Set<ServiceRequestType>>(
    () => new Set()
  )
  const [lastSentType, setLastSentType] = useState<ServiceRequestType | null>(
    null
  )

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['table-emenu', qrCode],
    queryFn: () => menuApi.getTableMenu(qrCode),
    enabled: Boolean(qrCode),
    retry: false,
  })

  const serviceMutation = useMutation({
    mutationFn: (requestType: ServiceRequestType) => {
      if (!data) throw new Error('Chưa tải được thông tin bàn')
      return menuApi.callService(data.tableId, requestType)
    },
    onSuccess: (_, requestType) => {
      setSentTypes((prev) => {
        const next = new Set(prev)
        next.add(requestType)
        return next
      })
      setLastSentType(requestType)
      toast.success(
        'Đã gửi yêu cầu phục vụ',
        SERVICE_REQUEST_TYPE_LABELS[requestType]
      )
    },
    onError: (err, requestType) => {
      if (isAxiosError<ApiErrorResponse>(err)) {
        if (err.response?.status === 409) {
          setSentTypes((prev) => new Set(prev).add(requestType))
          setLastSentType(requestType)
          return
        }
        toast.error(err.response?.data?.message ?? 'Không thể gửi yêu cầu')
      } else {
        toast.error('Không thể gửi yêu cầu')
      }
    },
    onSettled: () => {
      setPendingType(null)
    },
  })

  const handleCallService = (type: ServiceRequestType) => {
    if (!data || pendingType !== null || sentTypes.has(type)) {
      return
    }
    setPendingType(type)
    serviceMutation.mutate(type)
  }

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    const message = isAxiosError<ApiErrorResponse>(error)
      ? (error.response?.data?.message ??
        'Mã QR không hợp lệ hoặc bàn chưa được check-in. Vui lòng liên hệ nhân viên.')
      : 'Mã QR không hợp lệ hoặc bàn chưa được check-in. Vui lòng liên hệ nhân viên.'

    return (
      <div className="max-w-md mx-auto px-4 py-10 space-y-6">
        <h1 className="font-serif text-2xl font-semibold text-ink">
          Thực đơn tại bàn
        </h1>
        <Card className="text-center space-y-4 py-8">
          <div className="w-12 h-12 rounded-xl bg-card border border-line flex items-center justify-center text-accent mx-auto">
            <AlertTriangle className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-semibold text-ink">
              Mã QR không hợp lệ
            </h2>
            <p className="text-sm text-ink-muted">{message}</p>
          </div>
          <Link to="/" className="inline-block">
            <Button variant="secondary">Về trang chủ</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const drinks = data.items.filter((i) => i.courseType === 'Beverage')

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          Thực đơn tại bàn
        </p>
        <h1 className="font-serif text-2xl font-semibold text-ink">
          VinDining · Bàn {data.tableNumber}
        </h1>
      </div>

      {/* 3 Service Request Buttons */}
      <section aria-label="Yêu cầu phục vụ" className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {SERVICE_BUTTONS.map((btn) => {
            const Icon = btn.icon
            const isBusy = pendingType === btn.type
            const isSent = sentTypes.has(btn.type)
            return (
              <Button
                key={btn.type}
                variant={isSent ? 'primary' : 'secondary'}
                size="sm"
                loading={isBusy}
                disabled={pendingType !== null || isSent}
                onClick={() => handleCallService(btn.type)}
                icon={!isBusy ? <Icon className="w-3.5 h-3.5" /> : undefined}
                className="h-auto py-2.5 px-2 flex-col gap-1 text-xs text-center"
              >
                <span>{isSent ? `Đã gửi · ${btn.label}` : btn.label}</span>
              </Button>
            )
          })}
        </div>

        {/* G3.2 Sent State Banner */}
        {lastSentType && (
          <div
            role="status"
            className="rounded-xl border border-primary/50 bg-surface p-3.5 flex items-start gap-2.5 text-sm"
          >
            <CheckCircle2
              className="w-4 h-4 text-accent shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="space-y-0.5">
              <p className="font-medium text-ink">
                Đã gửi yêu cầu: {SERVICE_REQUEST_TYPE_LABELS[lastSentType]}
              </p>
              <p className="text-xs text-ink-muted">
                Nhân viên phục vụ sẽ hỗ trợ Bàn {data.tableNumber} trong giây lát.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Set Menu Section First */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-accent">
            Set Menu đặc biệt
          </h2>
          <p className="text-xs text-ink-muted">
            Được phục vụ theo trình tự từng course
          </p>
        </div>

        <div className="space-y-3">
          {data.tastingMenus.map((set) => (
            <Card key={set.id} padding="sm" className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-serif text-base font-semibold text-ink">
                  {set.name}
                </h3>
                <span className="text-xs font-semibold text-accent shrink-0">
                  <Money amount={set.price} tone="accent" /> / khách
                </span>
              </div>
              <ul className="space-y-1 text-xs text-ink-muted">
                {set.items
                  .slice()
                  .sort((a, b) => a.courseOrder - b.courseOrder)
                  .map((item) => (
                    <li key={item.id}>
                      • {COURSE_TYPE_LABELS[item.courseType]}:{' '}
                      {item.menuItemName} ({item.prepTimeMinutes} phút)
                    </li>
                  ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* À la carte by Course */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-accent">
          Thực đơn món lẻ
        </h2>

        {FOOD_COURSE_ORDER.map((course) => {
          const items = data.items.filter((i) => i.courseType === course)
          if (items.length === 0) return null
          return (
            <Card key={course} padding="sm" className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">
                {COURSE_TYPE_LABELS[course]}
              </h3>
              <div className="divide-y divide-line">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3"
                  >
                    {item.imageUrl && (
                      <ThemedImage
                        name={item.imageUrl}
                        alt={item.name}
                        width={56}
                        height={56}
                        loading="lazy"
                        className="w-12 h-12 rounded-lg object-cover shrink-0 border border-line"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-ink">
                          {item.name}
                        </p>
                        {item.status === 'SoldOut' && (
                          <StatusBadge status="SoldOut" domain="menuItem" />
                        )}
                      </div>
                      <p className="text-xs text-ink-muted">
                        Thời gian chuẩn bị: {item.prepTimeMinutes} phút
                      </p>
                    </div>
                    <Money
                      amount={item.price}
                      tone="accent"
                      className="text-sm shrink-0"
                    />
                  </div>
                ))}
              </div>
            </Card>
          )
        })}

        {drinks.length > 0 && (
          <Card padding="sm" className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">
              {COURSE_TYPE_LABELS.Beverage}
            </h3>
            <div className="divide-y divide-line">
              {drinks.map((drink) => (
                <div
                  key={drink.id}
                  className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-ink">{drink.name}</span>
                    {drink.status === 'SoldOut' && (
                      <StatusBadge status="SoldOut" domain="menuItem" />
                    )}
                  </div>
                  <Money amount={drink.price} tone="accent" />
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>
    </div>
  )
}
