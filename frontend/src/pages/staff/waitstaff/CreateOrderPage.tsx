import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Button, Card, PageHeader, Skeleton } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { menuApi, orderApi, tableApi } from '@/services/api'
import type { ApiErrorResponse, OrderItemInput } from '@/types'
import { OrderMenuPicker } from './OrderMenuPicker'

/** W3 & W3x — Create first order for a seated table with Set Menu or Course-grouped A La Carte items. */
export function CreateOrderPage() {
  useDocumentTitle('Tạo Order')
  const { tableId = '' } = useParams<{ tableId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const tableQuery = useQuery({
    queryKey: ['table', tableId],
    queryFn: () => tableApi.getById(tableId),
    enabled: Boolean(tableId),
  })

  const menuQuery = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => menuApi.getItems(),
  })

  const tastingQuery = useQuery({
    queryKey: ['public-tasting-menus'],
    queryFn: () => menuApi.getTastingMenus(),
  })

  const createMutation = useMutation({
    mutationFn: (payload: {
      tastingMenuId: string | null
      items: OrderItemInput[]
    }) =>
      orderApi.create({
        tableId,
        guestCount:
          tableQuery.data?.table.guestCount ??
          tableQuery.data?.activeReservation?.partySize ??
          2,
        tastingMenuId: payload.tastingMenuId,
        items: payload.items,
      }),
    onSuccess: () => {
      setSubmitError(null)
      void queryClient.invalidateQueries({ queryKey: ['tables'] })
      void queryClient.invalidateQueries({ queryKey: ['table', tableId] })
      navigate(`/phuc-vu/order/${encodeURIComponent(tableId)}`, {
        replace: true,
      })
    },
    onError: (err) => {
      void queryClient.invalidateQueries({ queryKey: ['menu-items'] })
      if (isAxiosError<ApiErrorResponse>(err)) {
        const msg = err.response?.data?.message ?? 'Không thể tạo order lúc này'
        setSubmitError(
          msg.includes('tạm hết')
            ? `${msg} — vui lòng tư vấn món khác cho khách.`
            : msg
        )
      } else {
        setSubmitError('Không thể kết nối hệ thống')
      }
    },
  })

  if (tableQuery.isLoading || menuQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (tableQuery.isError || !tableQuery.data) {
    return (
      <div className="space-y-4">
        <PageHeader title="Tạo Order" backTo="/phuc-vu" />
        <Card className="space-y-3 text-center py-6">
          <p className="text-sm text-danger">Không thể tải thông tin bàn.</p>
          <Button
            size="sm"
            variant="secondary"
            className="min-h-[44px]"
            onClick={() => tableQuery.refetch()}
          >
            Thử lại
          </Button>
        </Card>
      </div>
    )
  }

  const { table, activeOrder, activeReservation } = tableQuery.data
  const guestCount = table.guestCount ?? activeReservation?.partySize ?? 2

  if (activeOrder) {
    return (
      <div className="space-y-4">
        <PageHeader title={`Bàn ${table.tableNumber}`} backTo="/phuc-vu" />
        <Card className="space-y-3">
          <p className="text-sm text-ink">
            Bàn {table.tableNumber} đã có đơn gọi món đang phục vụ.
          </p>
          <Button
            variant="primary"
            className="w-full min-h-[44px]"
            onClick={() =>
              navigate(`/phuc-vu/order/${encodeURIComponent(table.id)}`)
            }
          >
            Xem Order đang phục vụ
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Tạo Order · ${table.tableNumber} (${guestCount} khách)`}
        backTo={`/phuc-vu/ban/${encodeURIComponent(table.id)}`}
      />

      {table.status !== 'Occupied' ? (
        <Card className="space-y-3">
          <p className="text-sm text-danger">
            Chỉ có thể tạo Order khi bàn đang phục vụ.
          </p>
          <Button
            variant="secondary"
            className="w-full min-h-[44px]"
            onClick={() => navigate('/phuc-vu')}
          >
            Về sơ đồ bàn
          </Button>
        </Card>
      ) : (
        <OrderMenuPicker
          menuItems={menuQuery.data ?? []}
          tastingMenus={tastingQuery.data ?? []}
          guestCount={guestCount}
          allowSetMenu
          submitLabel={() => 'Gửi đơn'}
          errorMessage={submitError}
          isSubmitting={createMutation.isPending}
          onSubmit={(payload) => {
            setSubmitError(null)
            createMutation.mutate(payload)
          }}
        />
      )}
    </div>
  )
}
