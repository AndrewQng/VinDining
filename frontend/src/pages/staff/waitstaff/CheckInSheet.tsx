import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Search } from 'lucide-react'
import { TABLE_ZONE_LABELS, formatSlotTime } from '@/domain'
import {
  Button,
  Card,
  Drawer,
  Input,
  Money,
  NumberStepper,
  StatusBadge,
  Tabs,
} from '@/components/ui'
import { reservationApi, tableApi } from '@/services/api'
import type { ApiErrorResponse, ReservationDto, TableDto } from '@/types'

export interface CheckInSheetProps {
  table: TableDto | null
  onClose: () => void
  onCheckedIn: (tableId: string) => void
}

type CheckInTab = 'reserved' | 'walkin'

/** W2 & W2w bottom sheet supporting both reserved check-in (code/phone) and walk-in seating. */
export function CheckInSheet({
  table,
  onClose,
  onCheckedIn,
}: CheckInSheetProps) {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<CheckInTab>('walkin')
  const [searchInput, setSearchInput] = useState('')
  const [matchedReservation, setMatchedReservation] =
    useState<ReservationDto | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [guestCount, setGuestCount] = useState(2)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const tableDetailQuery = useQuery({
    queryKey: ['table', table?.id],
    queryFn: () => tableApi.getById(table!.id),
    enabled: Boolean(table && table.status === 'Reserved'),
  })

  useEffect(() => {
    if (!table) return
    setSubmitError(null)
    setLookupError(null)
    if (table.status === 'Reserved') {
      setTab('reserved')
      setSearchInput(table.currentReservationCode ?? '')
      setMatchedReservation(null)
    } else {
      setTab('walkin')
      setSearchInput('')
      setMatchedReservation(null)
      setGuestCount(Math.min(Math.max(2, 1), table.capacity))
    }
  }, [table])

  useEffect(() => {
    if (
      table?.status === 'Reserved' &&
      tableDetailQuery.data?.activeReservation
    ) {
      setMatchedReservation(tableDetailQuery.data.activeReservation)
      setSearchInput(tableDetailQuery.data.activeReservation.bookingCode)
    }
  }, [table?.status, tableDetailQuery.data])

  const searchMutation = useMutation({
    mutationFn: async (term: string) => {
      const cleaned = term.trim()
      if (!cleaned) {
        throw new Error('Vui lòng nhập mã đặt bàn hoặc số điện thoại')
      }
      const list = await reservationApi.search({
        status: 'Reserved',
        search: cleaned,
      })
      const preferred =
        list.find((r) => r.tableId === table?.id) ?? list[0] ?? null
      if (!preferred) {
        throw new Error('Không tìm thấy đơn đặt bàn phù hợp ở trạng thái Đã đặt')
      }
      return preferred
    },
    onSuccess: (found) => {
      setLookupError(null)
      setMatchedReservation(found)
    },
    onError: (err) => {
      setMatchedReservation(null)
      if (isAxiosError<ApiErrorResponse>(err)) {
        setLookupError(
          err.response?.data?.message ?? 'Không thể tra cứu đặt bàn lúc này'
        )
      } else {
        setLookupError((err as Error).message)
      }
    },
  })

  const checkInMutation = useMutation({
    mutationFn: (code: string) =>
      tableApi.checkIn(table!.id, { reservationCode: code }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tables'] })
      void queryClient.invalidateQueries({ queryKey: ['table', table!.id] })
      onCheckedIn(table!.id)
    },
    onError: (err) => {
      if (isAxiosError<ApiErrorResponse>(err)) {
        setSubmitError(
          err.response?.data?.message ?? 'Không thể check-in cho bàn này'
        )
      } else {
        setSubmitError('Không thể kết nối hệ thống')
      }
    },
  })

  const walkInMutation = useMutation({
    mutationFn: () => tableApi.walkIn(table!.id, { guestCount }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tables'] })
      void queryClient.invalidateQueries({ queryKey: ['table', table!.id] })
      onCheckedIn(table!.id)
    },
    onError: (err) => {
      if (isAxiosError<ApiErrorResponse>(err)) {
        setSubmitError(
          err.response?.data?.message ?? 'Không thể nhận khách vãng lai'
        )
      } else {
        setSubmitError('Không thể kết nối hệ thống')
      }
    },
  })

  if (!table) return null

  const zoneLabel = TABLE_ZONE_LABELS[table.zone]
  const canSwitchToWalkIn = table.status === 'Available'
  const headerTitle =
    tab === 'reserved'
      ? `Check-in bàn ${table.tableNumber}`
      : `Check-in khách vãng lai`

  return (
    <Drawer open={Boolean(table)} onClose={onClose} title={headerTitle}>
      <div className="space-y-4">
        <p className="text-xs text-ink-muted">
          Bàn {table.tableNumber} · {table.capacity} ghế · {zoneLabel}
        </p>

        {canSwitchToWalkIn && (
          <Tabs
            value={tab}
            onChange={(next) => {
              setTab(next)
              setSubmitError(null)
              setLookupError(null)
            }}
            items={[
              { value: 'walkin', label: 'Khách vãng lai' },
              { value: 'reserved', label: 'Khách đặt trước' },
            ]}
            className="w-full justify-center"
          />
        )}

        {tab === 'reserved' ? (
          <ReservedCheckInPanel
            table={table}
            searchInput={searchInput}
            onSearchInputChange={setSearchInput}
            onSearch={() => searchMutation.mutate(searchInput)}
            isSearching={searchMutation.isPending}
            lookupError={lookupError}
            matchedReservation={matchedReservation}
            submitError={submitError}
            isSubmitting={checkInMutation.isPending}
            onConfirm={() => {
              const code =
                matchedReservation?.bookingCode ?? searchInput.trim()
              if (code) checkInMutation.mutate(code)
            }}
          />
        ) : (
          <WalkInCheckInPanel
            table={table}
            guestCount={guestCount}
            onGuestCountChange={setGuestCount}
            submitError={submitError}
            isSubmitting={walkInMutation.isPending}
            onConfirm={() => walkInMutation.mutate()}
            onCancel={onClose}
          />
        )}
      </div>
    </Drawer>
  )
}

export interface ReservedPanelProps {
  table: TableDto
  searchInput: string
  onSearchInputChange: (val: string) => void
  onSearch: () => void
  isSearching: boolean
  lookupError: string | null
  matchedReservation: ReservationDto | null
  submitError: string | null
  isSubmitting: boolean
  onConfirm: () => void
  hideSearch?: boolean
}

export function ReservedCheckInPanel({
  table,
  searchInput,
  onSearchInputChange,
  onSearch,
  isSearching,
  lookupError,
  matchedReservation,
  submitError,
  isSubmitting,
  onConfirm,
  hideSearch = false,
}: ReservedPanelProps) {
  return (
    <div className="space-y-4">
      {!hideSearch && (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label="Mã đặt bàn hoặc số điện thoại"
              placeholder="VD-7K3Q hoặc 0901 234 567"
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              className="min-h-[44px]"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="min-h-[44px]"
            icon={<Search className="w-4 h-4" />}
            loading={isSearching}
            onClick={onSearch}
          >
            Tìm
          </Button>
        </div>
      )}

      {lookupError && (
        <p className="text-xs text-danger" role="alert">
          {lookupError}
        </p>
      )}

      {matchedReservation && (
        <Card className="space-y-2.5 bg-card">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">
                Khách: {matchedReservation.guest.fullName}
              </p>
              <p className="text-xs text-ink-muted">
                Mã: {matchedReservation.bookingCode}
              </p>
            </div>
            <StatusBadge status={matchedReservation.status} />
          </div>

          <dl className="space-y-1.5 text-xs text-ink-muted">
            <div className="flex justify-between gap-2">
              <dt>Số điện thoại</dt>
              <dd className="text-ink font-medium tabular-nums">
                {matchedReservation.guest.phoneNumber}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Số lượng khách</dt>
              <dd className="text-ink font-medium tabular-nums">
                {matchedReservation.partySize} khách
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Giờ hẹn</dt>
              <dd className="text-ink font-medium tabular-nums">
                {formatSlotTime(matchedReservation.reservationTime)} · Bàn{' '}
                {matchedReservation.tableNumber} (
                {TABLE_ZONE_LABELS[matchedReservation.zone]})
              </dd>
            </div>
            {matchedReservation.deposit && (
              <div className="flex justify-between gap-2">
                <dt>Tiền cọc đã thanh toán</dt>
                <dd className="text-success font-semibold">
                  <Money amount={matchedReservation.deposit.amount} /> (
                  {matchedReservation.deposit.paymentMethod})
                </dd>
              </div>
            )}
          </dl>

          {matchedReservation.partySize > table.capacity && (
            <div className="pt-2 border-t border-line text-xs font-medium text-warning">
              Cảnh báo: đoàn {matchedReservation.partySize} khách vượt sức chứa bàn{' '}
              {table.tableNumber} ({table.capacity} ghế).
            </div>
          )}
          {matchedReservation.preOrderedTastingMenuName && (
            <div className="pt-2 border-t border-line text-xs font-medium text-accent">
              Set Menu đặt trước: {matchedReservation.preOrderedTastingMenuName} ×{' '}
              {matchedReservation.partySize}
            </div>
          )}
        </Card>
      )}

      {submitError && (
        <p className="text-xs text-danger" role="alert">
          {submitError}
        </p>
      )}

      <Button
        type="button"
        variant="primary"
        className="w-full min-h-[44px]"
        disabled={!matchedReservation}
        loading={isSubmitting}
        onClick={onConfirm}
      >
        Check-in khách vào bàn {table.tableNumber}
      </Button>
    </div>
  )
}

export interface WalkInPanelProps {
  table: TableDto
  guestCount: number
  onGuestCountChange: (value: number) => void
  submitError: string | null
  isSubmitting: boolean
  onConfirm: () => void
  onCancel?: () => void
}

export function WalkInCheckInPanel({
  table,
  guestCount,
  onGuestCountChange,
  submitError,
  isSubmitting,
  onConfirm,
  onCancel,
}: WalkInPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 rounded-xl bg-card border border-line px-4 py-3">
        <span className="text-sm font-medium text-ink">Số lượng khách</span>
        <NumberStepper
          value={guestCount}
          min={1}
          max={table.capacity}
          onChange={onGuestCountChange}
          label="Số lượng khách"
        />
      </div>

      {submitError && (
        <p className="text-xs text-danger" role="alert">
          {submitError}
        </p>
      )}

      <div className="space-y-2">
        <Button
          type="button"
          variant="primary"
          className="w-full min-h-[44px]"
          loading={isSubmitting}
          onClick={onConfirm}
        >
          Check-in vãng lai
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            className="w-full min-h-[44px]"
            onClick={onCancel}
          >
            Hủy
          </Button>
        )}
      </div>
    </div>
  )
}
