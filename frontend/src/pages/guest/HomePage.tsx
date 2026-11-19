import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import {
  Button,
  Card,
  Money,
  Skeleton,
  StatusBadge,
  ThemedImage,
} from '@/components/ui'
import {
  COURSE_TYPE_LABELS,
  TABLE_ZONE_LABELS,
} from '@/domain'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { menuApi, reservationApi } from '@/services/api'
import { useRealtime } from '@/services/realtime/useRealtime'
import type { CourseType, MenuItemDto, TableZone } from '@/types'
import { getDefaultBookingDate } from './bookingState'

const BOOKING_STEPS = [
  {
    num: '01',
    title: 'Chọn ngày, giờ & bàn',
    desc: 'Sảnh chính, VIP hoặc Ban công',
  },
  {
    num: '02',
    title: 'Chọn trước Set Menu',
    desc: 'Tùy chọn — Course 1 được chuẩn bị ngay khi nhận bàn',
  },
  {
    num: '03',
    title: 'Đặt cọc qua VNPAY',
    desc: '30% giá Set Menu, hoặc 500.000 ₫ / khách · hủy trước 4 tiếng hoàn 100% tiền cọc',
  },
]

const ZONES: { zone: TableZone; title: string; image: string }[] = [
  {
    zone: 'MainHall',
    title: TABLE_ZONE_LABELS.MainHall,
    image: 'zone_sanh_chinh.jpg',
  },
  {
    zone: 'VIP',
    title: 'Phòng VIP',
    image: 'zone_vip.jpg',
  },
  {
    zone: 'Balcony',
    title: TABLE_ZONE_LABELS.Balcony,
    image: 'zone_ban_cong.jpg',
  },
]

const FOOD_COURSE_ORDER: readonly CourseType[] = [
  'Appetizer',
  'MainCourse',
  'Dessert',
]

/** G0 — Public editorial guest home page. */
export function HomePage() {
  useDocumentTitle()
  const navigate = useNavigate()

  const {
    data: tastingMenus = [],
    isLoading: setsLoading,
    isError: setsError,
    refetch: refetchSets,
  } = useQuery({
    queryKey: ['public-tasting-menus'],
    queryFn: () => menuApi.getTastingMenus(),
  })

  useRealtime('menu:updated')
  useRealtime('table:status-changed')

  const {
    data: categories = [],
    isLoading: menuLoading,
    isError: menuError,
    refetch: refetchMenu,
  } = useQuery({
    queryKey: ['public-menu-categories'],
    queryFn: () => menuApi.getCategories(),
  })

  const { data: zoneSlots = [] } = useQuery({
    queryKey: ['public-zone-capacities'],
    queryFn: () =>
      reservationApi.getAvailableSlots({
        date: getDefaultBookingDate(),
        partySize: 1,
      }),
  })

  const zoneTables = zoneSlots[0]?.zoneTables ?? []
  const getZoneSeatRange = (zone: TableZone): string | null => {
    const caps = zoneTables
      .filter((t) => t.zone === zone)
      .map((t) => t.capacity)
    if (caps.length === 0) return null
    const min = Math.min(...caps)
    const max = Math.max(...caps)
    return min === max ? `Bàn ${min} ghế` : `Bàn ${min}–${max} ghế`
  }

  const allItems: MenuItemDto[] = categories.flatMap((c) => c.items ?? [])
  const foodItems = allItems.filter((item) => item.courseType !== 'Beverage')
  const drinkItems = allItems.filter((item) => item.courseType === 'Beverage')

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. Full-bleed Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="relative min-h-[540px] sm:min-h-[600px] flex items-center">
          <ThemedImage
            name="hero_desktop.jpg"
            alt="Không gian nhà hàng VinDining"
            width={1440}
            height={900}
            className="hidden md:block absolute inset-0 w-full h-full object-cover"
          />
          <ThemedImage
            name="hero_mobile.jpg"
            alt="Bàn ăn tại VinDining"
            width={780}
            height={1120}
            className="md:hidden absolute inset-0 w-full h-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-bg/95 via-bg/80 to-bg/25"
          />

          <div className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 py-16">
            <div className="max-w-xl space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                VinDining
              </p>
              <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-ink leading-tight">
                Một bữa tối trọn vẹn, từng Course một
              </h1>
              <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
                Đặt bàn trực tuyến, chọn trước Set Menu — đến nơi chỉ việc
                thưởng thức.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button size="lg" onClick={() => navigate('/dat-ban')}>
                  Đặt bàn ngay
                </Button>
                <a href="#set-menu">
                  <Button variant="secondary" size="lg">
                    Xem Set Menu
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Set Menu first */}
      <section
        id="set-menu"
        className="max-w-6xl mx-auto px-4 sm:px-6 scroll-mt-20 space-y-8"
      >
        <div className="space-y-1.5">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink">
            Set Menu
          </h2>
          <p className="text-sm text-ink-muted">Thực đơn nếm thử 3 Course</p>
        </div>

        {setsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        ) : setsError ? (
          <Card className="flex items-center justify-between gap-4">
            <p className="text-sm text-ink-muted">
              Không thể tải danh sách Set Menu.
            </p>
            <Button variant="secondary" size="sm" onClick={() => refetchSets()}>
              Thử lại
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tastingMenus.map((set) => (
              <Card
                key={set.id}
                padding="none"
                className="overflow-hidden flex flex-col justify-between"
              >
                <div className="aspect-[16/10] w-full bg-card overflow-hidden">
                  <ThemedImage
                    name={set.imageUrl ?? 'set_thuong_hang.jpg'}
                    alt={set.name}
                    width={800}
                    height={500}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                  <div className="space-y-3">
                    <h3 className="font-serif text-xl sm:text-2xl font-semibold text-ink">
                      {set.name}
                    </h3>
                    <ul className="space-y-1.5 text-sm text-ink-muted">
                      {set.items
                        .slice()
                        .sort((a, b) => a.courseOrder - b.courseOrder)
                        .map((item) => (
                          <li key={item.id}>
                            <span className="text-ink">
                              {COURSE_TYPE_LABELS[item.courseType]}
                            </span>{' '}
                            — {item.menuItemName}
                          </li>
                        ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-line flex items-center justify-between gap-4">
                    <div className="text-base font-semibold">
                      <Money amount={set.price} tone="accent" />{' '}
                      <span className="text-xs font-normal text-ink-muted">
                        / khách
                      </span>
                    </div>
                    <Link
                      to={`/dat-ban?set=${encodeURIComponent(set.id)}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
                    >
                      <span>Đặt bàn với set này</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 3. 3-step booking explainer */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink">
          Ba bước đến bàn ăn
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BOOKING_STEPS.map((step) => (
            <Card key={step.num} className="space-y-2">
              <p className="font-serif text-2xl font-semibold text-accent">
                {step.num}
              </p>
              <h3 className="text-base font-semibold text-ink">{step.title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                {step.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. Zones */}
      <section
        id="khong-gian"
        className="max-w-6xl mx-auto px-4 sm:px-6 scroll-mt-20 space-y-6"
      >
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink">
          Không gian
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {ZONES.map((z) => (
            <Card
              key={z.zone}
              padding="none"
              className="overflow-hidden flex flex-col justify-between"
            >
              <div className="aspect-[16/10] w-full bg-card overflow-hidden">
                <ThemedImage
                  name={z.image}
                  alt={z.title}
                  width={640}
                  height={400}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-ink">
                    {z.title}
                  </h3>
                  {getZoneSeatRange(z.zone) && (
                    <p className="text-xs text-ink-muted mt-0.5">
                      {getZoneSeatRange(z.zone)}
                    </p>
                  )}
                </div>
                <Link
                  to={`/dat-ban?zone=${z.zone}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
                >
                  <span>Chọn khu vực này</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 5. À la carte menu & drinks */}
      <section
        id="thuc-don"
        className="max-w-6xl mx-auto px-4 sm:px-6 scroll-mt-20 space-y-8"
      >
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink">
          Thực đơn à la carte
        </h2>

        {menuLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : menuError ? (
          <Card className="flex items-center justify-between gap-4">
            <p className="text-sm text-ink-muted">
              Không thể tải thực đơn à la carte.
            </p>
            <Button variant="secondary" size="sm" onClick={() => refetchMenu()}>
              Thử lại
            </Button>
          </Card>
        ) : (
          <div className="space-y-8">
            {FOOD_COURSE_ORDER.map((course) => {
              const items = foodItems.filter((i) => i.courseType === course)
              if (items.length === 0) return null
              return (
                <div key={course} className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-accent">
                    {COURSE_TYPE_LABELS[course]}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {items.map((item) => (
                      <Card
                        key={item.id}
                        padding="none"
                        className="overflow-hidden flex flex-col justify-between"
                      >
                        <div className="aspect-[4/3] w-full bg-card overflow-hidden">
                          {item.imageUrl ? (
                            <ThemedImage
                              name={item.imageUrl}
                              alt={item.name}
                              width={480}
                              height={360}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-semibold text-ink">
                                {item.name}
                              </h4>
                              {item.status === 'SoldOut' && (
                                <StatusBadge
                                  status="SoldOut"
                                  domain="menuItem"
                                />
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-ink-muted line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="pt-2 text-sm">
                            <Money amount={item.price} tone="accent" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}

            {drinkItems.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-accent">
                  {COURSE_TYPE_LABELS.Beverage}
                </h3>
                <Card padding="sm" className="divide-y divide-line max-w-lg">
                  {drinkItems.map((drink) => (
                    <div
                      key={drink.id}
                      className="py-2.5 px-2 flex items-center justify-between gap-4 text-sm"
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
                </Card>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 6. Closing Booking Band */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface">
          <ThemedImage
            name="hero_desktop.jpg"
            alt=""
            width={1200}
            height={360}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-25"
          />
          <div className="relative z-10 px-6 py-12 sm:px-10 sm:py-14 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink">
              Giữ chỗ cho buổi tối của bạn
            </h2>
            <Button size="lg" onClick={() => navigate('/dat-ban')}>
              Đặt bàn ngay
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
