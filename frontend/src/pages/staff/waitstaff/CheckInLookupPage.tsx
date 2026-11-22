import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { TABLE_ZONE_LABELS, formatPhoneNumber, formatSlotTime } from '@/domain'
import {
  Button,
  Card,
  EmptyState,
  Input,
  Money,
  PageHeader,
  StatusBadge,
} from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { reservationApi, tableApi } from '@/services/api'
import type { ReservationDto } from '@/types'

/** Dedicated check-in lookup view for `/phuc-vu/check-in`. */
export function CheckInLookupPage() {
  useDocumentTitle('Check-in nhận bàn')
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ReservationDto[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const initialQuery = useQuery({
    queryKey: ['waitstaff-confirmed-reservations'],
    queryFn: () => reservationApi.search({ status: 'Reserved' }),
  })

  const displayedResults = results ?? initialQuery.data ?? []

  const searchMutation = useMutation({
    mutationFn: (term: string) =>
      reservationApi.search({ status: 'Reserved', search: term.trim() }),
    onSuccess: (list) => {
      setError(null)
      setResults(list)
    },
    onError: () => {
      setError('Không thể tìm kiếm đặt bàn lúc này')
    },
  })

  const checkInMutation = useMutation({
    mutationFn: (res: ReservationDto) =>
      tableApi.checkIn(res.tableId, { reservationCode: res.bookingCode }),
    onSuccess: ({ table }) => {
      navigate(`/phuc-vu/ban/${encodeURIComponent(table.id)}`)
    },
    onError: () => {
      setError('Bàn chưa sẵn sàng ở trạng thái Đã đặt để check-in.')
    },
  })

  return (
    <div className="space-y-4">
      <PageHeader title="Check-in nhận bàn" backTo="/phuc-vu" />

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          searchMutation.mutate(query)
        }}
      >
        <div className="flex-1">
          <Input
            label="Mã đặt bàn hoặc số điện thoại"
            placeholder="VD-7K3Q hoặc 0901 234 567"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-[44px]"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          className="min-h-[44px]"
          icon={<Search className="w-4 h-4" />}
          loading={searchMutation.isPending}
        >
          Tìm
        </Button>
      </form>

      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}

      {!initialQuery.isLoading && displayedResults.length === 0 ? (
        <EmptyState
          title="Không tìm thấy đơn đặt bàn"
          description="Kiểm tra lại mã đặt bàn hoặc số điện thoại của khách."
        />
      ) : (
        <div className="space-y-3">
          {displayedResults.map((res) => (
            <Card key={res.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-ink">
                    {res.guest.fullName} · {res.bookingCode}
                  </p>
                  <p className="text-xs text-ink-muted">
                    Bàn {res.tableNumber} ({TABLE_ZONE_LABELS[res.zone]}) ·{' '}
                    {res.partySize} khách · {formatSlotTime(res.reservationTime)}
                  </p>
                  <p className="text-xs text-ink-muted tabular-nums">
                    {formatPhoneNumber(res.guest.phoneNumber)}
                  </p>
                  {res.preOrderedTastingMenuName && (
                    <p className="text-xs font-medium text-accent mt-1">
                      Đặt trước: {res.preOrderedTastingMenuName} × {res.partySize}
                    </p>
                  )}
                </div>
                <StatusBadge status={res.status} />
              </div>

              {res.deposit && (
                <p className="text-xs text-success font-medium">
                  Cọc đã thanh toán: <Money amount={res.deposit.amount} />
                </p>
              )}

              <Button
                type="button"
                variant="primary"
                className="w-full min-h-[44px]"
                loading={checkInMutation.isPending}
                onClick={() => checkInMutation.mutate(res)}
              >
                Check-in vào bàn {res.tableNumber}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
