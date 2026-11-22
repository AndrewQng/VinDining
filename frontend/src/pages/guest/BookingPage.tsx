import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import QRCode from 'qrcode'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  QrCode,
  ShieldCheck,
} from 'lucide-react'
import { GuestPhotoBackground } from '@/components/guest/GuestPhotoBackground'
import {
  Button,
  Card,
  Countdown,
  Input,
  Money,
  StatusBadge,
  Textarea,
} from '@/components/ui'
import {
  calculateDepositAmount,
  formatDateTime,
  isHoldExpired,
  TABLE_ZONE_LABELS,
} from '@/domain'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'
import { menuApi, reservationApi } from '@/services/api'
import { toast } from '@/stores/useToastStore'
import type { ApiErrorResponse, DepositPaymentMethod, TableZone } from '@/types'
import {
  buildReservationIso,
  clearBookingDraft,
  createInitialBookingDraft,
  getPreviousBookingStep,
  loadBookingDraft,
  saveBookingDraft,
  validateContactFields,
  type BookingDraft,
  type BookingStep,
} from './bookingState'
import { BookingNav } from './booking/BookingNav'
import {
  BookingProgressStepper,
  type StepItem,
} from './booking/BookingProgressStepper'
import { BookingStepSetMenu } from './booking/BookingStepSetMenu'
import { BookingStepTable } from './booking/BookingStepTable'
import { BookingStepTimeZone } from './booking/BookingStepTimeZone'
import { BookingSummaryCard } from './booking/BookingSummaryCard'

const STEPPER_ITEMS: StepItem[] = [
  { step: 'time-zone', label: 'Thời gian & khu vực' },
  { step: 'table', label: 'Chọn bàn' },
  { step: 'set-menu', label: 'Set Menu' },
  { step: 'contact', label: 'Liên hệ' },
  { step: 'hold', label: 'Giữ chỗ & cọc' },
  { step: 'confirmed', label: 'Xác nhận' },
]

const BOOKING_CONTACT_FORM_ID = 'booking-contact-form'

const NO_TABLE = { tableId: null, tableNumber: null, tableCapacity: null } as const

/** G1 — Multi-step guest reservation & deposit booking flow. */
export function BookingPage() {
  useDocumentTitle('Đặt bàn & đặt cọc')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const querySetId = searchParams.get('set')
  const queryZone = searchParams.get('zone') as TableZone | null
  const queryConfirmed = searchParams.get('confirmed')

  const [draft, setDraft] = useState<BookingDraft>(() => {
    const loaded = loadBookingDraft({ setId: querySetId, zone: queryZone })
    if (queryConfirmed && loaded.confirmedReservation?.bookingCode === queryConfirmed) {
      return { ...loaded, step: 'confirmed' }
    }
    if ((querySetId || queryZone) && (loaded.step === 'confirmed' || loaded.step === 'expired')) {
      return createInitialBookingDraft({ setId: querySetId, zone: queryZone })
    }
    return loaded
  })

  const [contactErrors, setContactErrors] = useState<
    Partial<Record<'fullName' | 'phoneNumber' | 'email', string>>
  >({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  useEffect(() => {
    saveBookingDraft(draft)
  }, [draft])

  const holdBookingCode = draft.holdReservation?.bookingCode ?? ''
  const holdDepositAmount =
    draft.holdReservation?.deposit?.amount ??
    calculateDepositAmount({
      guestCount: draft.partySize,
      setMenuPricePerGuest: null,
    })

  useEffect(() => {
    if (draft.step !== 'hold' || !holdBookingCode) {
      setQrDataUrl('')
      return
    }
    let active = true
    const payload = `VIETQR|VINDINING|${holdBookingCode}|${holdDepositAmount}`
    void QRCode.toDataURL(payload, {
      width: 176,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url)
      })
      .catch(() => {
        if (active) setQrDataUrl('')
      })
    return () => {
      active = false
    }
  }, [draft.step, holdBookingCode, holdDepositAmount])

  const { data: polledHoldReservation } = useQuery({
    queryKey: ['pending-reservation-poll', holdBookingCode],
    queryFn: () => reservationApi.getByCode(holdBookingCode),
    enabled: draft.step === 'hold' && Boolean(holdBookingCode),
    refetchInterval: 2500,
    retry: false,
  })

  useEffect(() => {
    if (draft.step !== 'hold' || !polledHoldReservation) return
    if (polledHoldReservation.status === 'Reserved') {
      void queryClient.invalidateQueries({ queryKey: ['booking-slots'] })
      void queryClient.invalidateQueries({ queryKey: ['booking-all-slots'] })
      setDraft((prev) => ({
        ...prev,
        step: 'confirmed',
        holdReservation: null,
        confirmedReservation: polledHoldReservation,
      }))
    } else if (
      polledHoldReservation.status === 'Expired_Cancelled' ||
      polledHoldReservation.status === 'Cancelled_Forfeited' ||
      polledHoldReservation.status === 'Cancelled_Refunded'
    ) {
      setDraft((prev) => ({ ...prev, step: 'expired', holdReservation: null }))
    }
  }, [draft.step, polledHoldReservation, queryClient])

  // A new step starts at the top of its card: if the card begins above the
  // screen (the guest scrolled down to the buttons on a phone), jump back to it.
  // Focus moves to the new step so keyboard and screen-reader users land on it.
  const stepCardRef = useRef<HTMLDivElement>(null)
  const firstStepRender = useRef(true)
  useEffect(() => {
    const card = stepCardRef.current
    if (!card) return
    if (firstStepRender.current) {
      firstStepRender.current = false
      return
    }
    const top = card.getBoundingClientRect().top
    if (top < 0) {
      window.scrollTo({ top: Math.max(0, window.scrollY + top - 80) })
    }
    card.focus({ preventScroll: true })
  }, [draft.step])

  useEffect(() => {
    if (
      draft.step === 'hold' &&
      draft.holdReservation &&
      isHoldExpired(draft.holdReservation.holdExpiresAt)
    ) {
      setDraft((prev) => ({ ...prev, step: 'expired' }))
    }
  }, [draft.step, draft.holdReservation])

  const { data: tastingMenus = [] } = useQuery({
    queryKey: ['public-tasting-menus'],
    queryFn: () => menuApi.getTastingMenus(),
  })

  const selectedSet =
    tastingMenus.find((m) => m.id === draft.preOrderedTastingMenuId) ?? null

  const createMutation = useMutation({
    mutationFn: () =>
      reservationApi.create({
        tableId: draft.tableId!,
        reservationTime: buildReservationIso(draft.date, draft.time),
        partySize: draft.partySize,
        preOrderedTastingMenuId: draft.preOrderedTastingMenuId,
        fullName: draft.fullName.trim(),
        phoneNumber: draft.phoneNumber.trim(),
        email: draft.email.trim(),
        note: draft.note.trim() || null,
        paymentMethod: draft.paymentMethod,
      }),
    onSuccess: (res) => {
      setSubmitError(null)
      void queryClient.invalidateQueries({ queryKey: ['booking-slots'] })
      void queryClient.invalidateQueries({ queryKey: ['booking-all-slots'] })
      setDraft((prev) => ({
        ...prev,
        step: 'hold',
        holdReservation: res.reservation,
      }))
    },
    onError: (err) => {
      if (isAxiosError<ApiErrorResponse>(err)) {
        setSubmitError(err.response?.data?.message ?? 'Không thể tạo giữ chỗ')
      } else {
        setSubmitError('Không thể kết nối hệ thống')
      }
    },
  })

  const completePaymentMutation = useMutation({
    mutationFn: () => {
      const code = draft.holdReservation?.bookingCode ?? ''
      return reservationApi.processVnPayIpn({
        bookingCode: code,
        transactionId: `VNP-${code}-${Date.now()}`,
        paymentMethod: draft.paymentMethod,
        responseCode: '00',
      })
    },
    onSuccess: (res) => {
      setPaymentError(null)
      void queryClient.invalidateQueries({ queryKey: ['booking-slots'] })
      void queryClient.invalidateQueries({ queryKey: ['booking-all-slots'] })
      if (!res.success || res.reservation?.status !== 'Reserved') {
        setDraft((prev) => ({ ...prev, step: 'expired', holdReservation: null }))
        return
      }
      setDraft((prev) => ({
        ...prev,
        step: 'confirmed',
        holdReservation: null,
        confirmedReservation: res.reservation,
      }))
    },
    onError: (err) => {
      if (isAxiosError<ApiErrorResponse>(err)) {
        if (err.response?.status === 410) {
          setDraft((prev) => ({ ...prev, step: 'expired', holdReservation: null }))
          return
        }
        setPaymentError(err.response?.data?.message ?? 'Thanh toán không thành công')
      } else {
        setPaymentError('Không thể kết nối cổng thanh toán')
      }
    },
  })

  const cancelHoldMutation = useMutation({
    mutationFn: async () => {
      const code = draft.holdReservation?.bookingCode
      if (!code) return
      await reservationApi.processVnPayIpn({
        bookingCode: code,
        transactionId: `VNP-CANCEL-${code}-${Date.now()}`,
        paymentMethod: draft.paymentMethod,
        responseCode: '24',
      })
    },
    onSettled: () => {
      setPaymentError(null)
      void queryClient.invalidateQueries({ queryKey: ['booking-slots'] })
      void queryClient.invalidateQueries({ queryKey: ['booking-all-slots'] })
      setDraft((prev) => ({
        ...prev,
        step: 'table',
        holdReservation: null,
      }))
      toast.info('Đã hủy giao dịch và mở khóa bàn')
    },
  })

  const handleBack = () => {
    const prev = getPreviousBookingStep(draft.step)
    if (prev) {
      setSubmitError(null)
      setDraft((d) => ({ ...d, step: prev }))
    }
  }

  const handleContactSubmit = (e: FormEvent) => {
    e.preventDefault()
    const errors = validateContactFields({
      fullName: draft.fullName,
      phoneNumber: draft.phoneNumber,
      email: draft.email,
    })
    setContactErrors(errors)
    if (Object.keys(errors).length > 0) return
    createMutation.mutate()
  }

  const handleRestart = () => {
    clearBookingDraft()
    setContactErrors({})
    setSubmitError(null)
    setDraft(createInitialBookingDraft())
    navigate('/dat-ban', { replace: true })
  }

  const showSummarySidebar =
    draft.step !== 'confirmed' && draft.step !== 'expired'

  return (
    <div className="relative min-h-[calc(100dvh-4rem)] overflow-x-clip">
      <GuestPhotoBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
        <div className="rounded-2xl border border-line bg-surface/92 backdrop-blur-md px-4 py-3 sm:px-5 sm:py-3.5 space-y-2.5">
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-ink">
            Đặt bàn
          </h1>

          <BookingProgressStepper
            steps={STEPPER_ITEMS}
            currentStep={draft.step}
            onSelectStep={(targetStep: BookingStep) => {
              setSubmitError(null)
              setDraft((d) => ({ ...d, step: targetStep }))
            }}
          />
        </div>

      <div
        className={cn(
          'grid grid-cols-1 gap-6 items-start',
          showSummarySidebar ? 'lg:grid-cols-3' : 'lg:grid-cols-1 max-w-2xl mx-auto w-full'
        )}
      >
        <div
          key={draft.step}
          ref={stepCardRef}
          tabIndex={-1}
          role="region"
          aria-label={STEPPER_ITEMS.find((i) => i.step === draft.step)?.label}
          data-testid="booking-step-card"
          className={cn(showSummarySidebar && 'lg:col-span-2', 'animate-step-fade space-y-6 outline-none')}
        >
          {draft.step === 'time-zone' && (
            <BookingStepTimeZone
              date={draft.date}
              time={draft.time}
              partySize={draft.partySize}
              zone={draft.zone}
              onChange={(patch) =>
                setDraft((d) => ({ ...d, ...patch, ...NO_TABLE }))
              }
            />
          )}

          {draft.step === 'table' && (
            <BookingStepTable
              date={draft.date}
              time={draft.time}
              partySize={draft.partySize}
              zone={draft.zone}
              selectedTableId={draft.tableId}
              onSelectTable={(table) =>
                setDraft((d) => ({
                  ...d,
                  tableId: table.id,
                  tableNumber: table.tableNumber,
                  tableCapacity: table.capacity,
                }))
              }
              onChangeZone={(zone) => setDraft((d) => ({ ...d, zone, ...NO_TABLE }))}
              onChangeTime={(time) => setDraft((d) => ({ ...d, time, ...NO_TABLE }))}
            />
          )}

          {/* Step 3: Optional Set Menu */}
          {draft.step === 'set-menu' && (
            <BookingStepSetMenu
              tastingMenus={tastingMenus}
              partySize={draft.partySize}
              selectedSetId={draft.preOrderedTastingMenuId}
              onSelectSet={(setId) =>
                setDraft((d) => ({ ...d, preOrderedTastingMenuId: setId }))
              }
            />
          )}

          {/* Step 4: Contact info */}
          {draft.step === 'contact' && (
            <Card className="bg-surface/95 backdrop-blur-md space-y-5">
              <h2 className="text-base font-semibold text-accent">
                Thông tin liên hệ
              </h2>

              {submitError && (
                <div
                  role="alert"
                  className="rounded-lg border border-danger/50 bg-danger/10 p-3 flex items-center gap-2 text-sm text-danger"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <form
                id={BOOKING_CONTACT_FORM_ID}
                onSubmit={handleContactSubmit}
                className="space-y-4"
              >
                <Input
                  label="Họ và tên *"
                  required
                  value={draft.fullName}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, fullName: e.target.value }))
                  }
                  placeholder="Nguyễn Văn An"
                  error={contactErrors.fullName}
                />
                <Input
                  label="Số điện thoại *"
                  type="tel"
                  required
                  value={draft.phoneNumber}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, phoneNumber: e.target.value }))
                  }
                  placeholder="0901 234 567"
                  error={contactErrors.phoneNumber}
                />
                <Input
                  label="Email *"
                  type="email"
                  required
                  value={draft.email}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, email: e.target.value }))
                  }
                  placeholder="an.nguyen@email.com"
                  error={contactErrors.email}
                />
                <Textarea
                  label="Ghi chú (tùy chọn)"
                  value={draft.note}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, note: e.target.value }))
                  }
                  placeholder="Yêu cầu vị trí bàn hoặc ghi chú phục vụ..."
                />
              </form>
            </Card>
          )}

          {/* Step 5: 17-minute Hold & Direct Deposit Payment */}
          {draft.step === 'hold' && draft.holdReservation && (
            <Card className="bg-surface/95 backdrop-blur-md space-y-5">
              <div className="rounded-xl bg-card border border-line p-5 text-center space-y-1.5">
                <p className="text-sm font-medium text-ink-muted">
                  Thời gian giữ chỗ còn lại
                </p>
                <div className="flex justify-center">
                  <Countdown
                    targetIso={draft.holdReservation.holdExpiresAt ?? undefined}
                    tone="warning"
                    className="text-3xl sm:text-4xl font-bold"
                    onExpire={() =>
                      setDraft((d) => ({ ...d, step: 'expired', holdReservation: null }))
                    }
                  />
                </div>
                <p className="text-xs text-ink-muted">
                  Bàn {draft.holdReservation.tableNumber} đang được giữ chỗ tạm thời. Quét mã bên dưới để hoàn tất đặt cọc.
                </p>
              </div>

              <div className="rounded-xl bg-card border border-line p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-line">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                    <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                    Cổng thanh toán đặt cọc VNPAY
                  </span>
                  <span className="text-xs font-mono text-ink-muted">
                    Mã giữ chỗ: {draft.holdReservation.bookingCode} · Bàn {draft.holdReservation.tableNumber}
                  </span>
                </div>

                <div
                  className="grid grid-cols-2 gap-3"
                  role="radiogroup"
                  aria-label="Phương thức thanh toán cọc"
                >
                  {(['VietQR', 'Card'] as DepositPaymentMethod[]).map((m) => {
                    const active = draft.paymentMethod === m
                    return (
                      <button
                        key={m}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() =>
                          setDraft((d) => ({ ...d, paymentMethod: m }))
                        }
                        className={cn(
                          'p-3 rounded-xl border text-left transition-colors flex items-center gap-3 cursor-pointer',
                          active
                            ? 'border-primary ring-1 ring-primary bg-surface text-accent'
                            : 'border-line bg-surface/60 text-ink-muted hover:text-ink'
                        )}
                      >
                        {m === 'VietQR' ? (
                          <QrCode className="w-5 h-5 shrink-0" aria-hidden="true" />
                        ) : (
                          <CreditCard className="w-5 h-5 shrink-0" aria-hidden="true" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-ink">
                            {m === 'VietQR' ? 'Quét mã VietQR' : 'Thẻ ngân hàng'}
                          </p>
                          <p className="text-xs text-ink-muted">
                            {m === 'VietQR'
                              ? 'App ngân hàng / Ví VNPAY'
                              : 'ATM nội địa / Visa / Master'}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {draft.paymentMethod === 'VietQR' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 items-center rounded-xl bg-surface border border-line p-4">
                    <div className="flex flex-col items-center gap-2 mx-auto">
                      <button
                        type="button"
                        onClick={() => completePaymentMutation.mutate()}
                        disabled={completePaymentMutation.isPending}
                        title="Quét mã hoặc nhấn vào mã QR để hoàn tất thanh toán"
                        className="p-2.5 rounded-xl bg-white border border-line shadow-sm cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      >
                        {qrDataUrl ? (
                          <img
                            src={qrDataUrl}
                            alt={`Mã VietQR thanh toán cọc ${draft.holdReservation.bookingCode}`}
                            className="w-40 h-40 object-contain"
                          />
                        ) : (
                          <div className="w-40 h-40 flex items-center justify-center">
                            <QrCode className="w-16 h-16 text-gray-800" />
                          </div>
                        )}
                      </button>
                      <span className="text-[11px] font-mono text-ink-muted">
                        VNPAY · VIETQR
                      </span>
                    </div>

                    <div className="space-y-2.5 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-ink-muted">Đơn vị thụ hưởng</span>
                        <span className="font-semibold text-ink">NHÀ HÀNG VINDINING</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-ink-muted">Số tiền đặt cọc</span>
                        <Money
                          amount={
                            draft.holdReservation.deposit?.amount ??
                            calculateDepositAmount({
                              guestCount: draft.partySize,
                              setMenuPricePerGuest: selectedSet?.price ?? null,
                            })
                          }
                          tone="accent"
                          className="text-lg font-bold"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-ink-muted">Nội dung CK</span>
                        <span className="font-mono font-semibold text-accent">
                          {draft.holdReservation.bookingCode}
                        </span>
                      </div>
                      {draft.holdReservation.preOrderedTastingMenuName && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-ink-muted">Set Menu đặt trước</span>
                          <span className="text-xs font-medium text-accent">
                            {draft.holdReservation.preOrderedTastingMenuName} ×{' '}
                            {draft.holdReservation.partySize}
                          </span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-line flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                          Đang chờ nhận giao dịch tự động...
                        </span>
                        <button
                          type="button"
                          disabled={completePaymentMutation.isPending}
                          onClick={() => completePaymentMutation.mutate()}
                          className="text-xs font-medium text-accent hover:underline cursor-pointer"
                        >
                          {completePaymentMutation.isPending
                            ? 'Đang kiểm tra...'
                            : 'Đã chuyển khoản xong'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-surface border border-line p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-muted">Số tiền thanh toán thẻ</span>
                      <Money
                        amount={
                          draft.holdReservation.deposit?.amount ??
                          calculateDepositAmount({
                            guestCount: draft.partySize,
                            setMenuPricePerGuest: selectedSet?.price ?? null,
                          })
                        }
                        tone="accent"
                        className="text-lg font-bold"
                      />
                    </div>
                    <p className="text-xs text-ink-muted">
                      Cổng thẻ nội địa / quốc tế VNPAY cho mã giữ chỗ{' '}
                      <span className="font-mono text-ink">
                        {draft.holdReservation.bookingCode}
                      </span>
                      .
                    </p>
                    <Button
                      fullWidth
                      loading={completePaymentMutation.isPending}
                      onClick={() => completePaymentMutation.mutate()}
                    >
                      Thanh toán thẻ ngay
                    </Button>
                  </div>
                )}

                {paymentError && (
                  <p role="alert" className="text-xs text-danger text-center">
                    {paymentError}
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Error G1.4x: Hold expired */}
          {draft.step === 'expired' && (
            <Card className="bg-surface/95 backdrop-blur-md text-center space-y-5 py-8">
              <div className="w-12 h-12 rounded-xl bg-card border border-line flex items-center justify-center text-danger mx-auto">
                <Clock className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h2 className="font-serif text-2xl font-semibold text-ink">
                  Hết thời gian giữ chỗ
                </h2>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Thời gian giữ chỗ 17 phút đã kết thúc. Yêu cầu đặt bàn đã hủy
                  để mở lại bàn.
                </p>
              </div>
              <Button onClick={handleRestart}>Thực hiện đặt lại</Button>
            </Card>
          )}

          {/* Step 6/7: Confirmed */}
          {draft.step === 'confirmed' && draft.confirmedReservation && (
            <Card className="bg-surface/95 backdrop-blur-md space-y-6 py-8">
              <div className="text-center space-y-2">
                <CheckCircle2
                  className="w-10 h-10 text-accent mx-auto"
                  aria-hidden="true"
                />
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink">
                  Đặt bàn thành công
                </h2>
                <p className="text-base text-ink-muted">
                  Mã đặt bàn:{' '}
                  <span className="font-mono font-semibold text-accent">
                    {draft.confirmedReservation.bookingCode}
                  </span>
                </p>
                <div className="pt-1">
                  <StatusBadge
                    status={draft.confirmedReservation.status}
                    domain="reservation"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-card border border-line p-5 space-y-2 text-sm">
                <h3 className="text-sm font-semibold text-accent">
                  Chi tiết đặt hẹn
                </h3>
                <p className="text-ink">
                  Bàn {draft.confirmedReservation.tableNumber} ·{' '}
                  {TABLE_ZONE_LABELS[draft.confirmedReservation.zone]} ·{' '}
                  {draft.confirmedReservation.partySize} khách
                </p>
                <p className="text-ink-muted">
                  Thời gian:{' '}
                  {formatDateTime(draft.confirmedReservation.reservationTime)}
                </p>
                <p className="text-ink-muted">
                  Khách hàng: {draft.confirmedReservation.guest.fullName} (
                  {draft.confirmedReservation.guest.phoneNumber})
                </p>
                <p className="text-ink-muted">
                  Tiền cọc:{' '}
                  <Money
                    amount={draft.confirmedReservation.deposit?.amount ?? 0}
                    tone="accent"
                  />{' '}
                  (Đã thanh toán qua VNPAY)
                </p>
                {draft.confirmedReservation.preOrderedTastingMenuName && (
                  <p className="text-accent">
                    Set Menu đặt trước:{' '}
                    {draft.confirmedReservation.preOrderedTastingMenuName} ×{' '}
                    {draft.confirmedReservation.partySize}
                  </p>
                )}
              </div>

              <p className="text-center text-xs text-ink-muted">
                Thông tin xác nhận đã được gửi qua SMS và Email của quý khách.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  to={`/tra-cuu?code=${encodeURIComponent(
                    draft.confirmedReservation.bookingCode
                  )}`}
                >
                  <Button variant="secondary">Tra cứu đặt bàn</Button>
                </Link>
                <Button onClick={handleRestart}>Đặt bàn mới</Button>
              </div>
            </Card>
          )}
        </div>

        {showSummarySidebar && (
          <div className="lg:sticky lg:top-20 space-y-4">
            <BookingSummaryCard
              draft={draft}
              selectedSet={selectedSet}
              tastingMenus={tastingMenus}
            />
            <BookingNav
              step={draft.step}
              hasSelectedTable={Boolean(draft.tableId)}
              isSubmittingContact={createMutation.isPending}
              isCancellingHold={cancelHoldMutation.isPending}
              contactFormId={BOOKING_CONTACT_FORM_ID}
              onBack={handleBack}
              onCancelHold={() => cancelHoldMutation.mutate()}
              onNext={() => {
                if (draft.step === 'time-zone') {
                  setDraft((d) => ({ ...d, step: 'table' }))
                } else if (draft.step === 'table') {
                  setDraft((d) => ({ ...d, step: 'set-menu' }))
                } else if (draft.step === 'set-menu') {
                  setDraft((d) => ({ ...d, step: 'contact' }))
                }
              }}
            />
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
