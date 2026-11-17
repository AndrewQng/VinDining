import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { formatVnd, isOrderLockedForTable } from '@/domain'
import { Button, Card, PageHeader, Skeleton } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { menuApi, orderApi, tableApi } from '@/services/api'
import type { ApiErrorResponse, OrderItemInput } from '@/types'
import { OrderMenuPicker } from './OrderMenuPicker'

/** W6 — Add extra drinks or dishes to an active order following course activation state. */
export function AddItemsPage() {
  useDocumentTitle('Gọi thêm món')
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

  const addItemsMutation = useMutation({
    mutationFn: (items: OrderItemInput[]) =>
      orderApi.addItems(tableQuery.data!.activeOrder!.id, { items }),
    onSuccess: () => {
      setSubmitError(null)
      void queryClient.invalidateQueries({ queryKey: ['table', tableId] })
      void queryClient.invalidateQueries({ queryKey: ['tables'] })
      navigate(`/phuc-vu/order/${encodeURIComponent(tableId)}`, {
        replace: true,
      })
    },
    onError: (err) => {
      void queryClient.invalidateQueries({ queryKey: ['menu-items'] })
      if (isAxiosError<ApiErrorResponse>(err)) {
        const msg = err.response?.data?.message ?? 'Không thể thêm món vào order'
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

  if (tableQuery.isError || !tableQuery.data?.table || !tableQuery.data.activeOrder) {
    return (
      <div className="space-y-4">
        <PageHeader title="Gọi thêm món" backTo="/phuc-vu" />
        <Card className="space-y-3 text-center py-6">
          <p className="text-sm text-danger">
            Không tìm thấy order đang phục vụ để gọi thêm món.
          </p>
          <Button
            variant="secondary"
            className="min-h-[44px]"
            onClick={() => navigate('/phuc-vu')}
          >
            Về sơ đồ bàn
          </Button>
        </Card>
      </div>
    )
  }

  const { table, activeOrder } = tableQuery.data
  const locked = isOrderLockedForTable(table.status)

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Gọi thêm món · ${table.tableNumber}`}
        backTo={`/phuc-vu/order/${encodeURIComponent(table.id)}`}
      />

      {locked ? (
        <Card className="space-y-3">
          <p className="text-sm text-danger">
            Order đã khóa — không thể gọi thêm món khi bàn chờ thanh toán.
          </p>
          <Button
            variant="secondary"
            className="w-full min-h-[44px]"
            onClick={() =>
              navigate(`/phuc-vu/order/${encodeURIComponent(table.id)}`)
            }
          >
            Quay lại Order
          </Button>
        </Card>
      ) : (
        <>
          <p className="text-xs text-ink-muted">
            Món thuộc Course đã kích hoạt sẽ được gửi bếp nấu ngay.
          </p>
          <OrderMenuPicker
            menuItems={menuQuery.data ?? []}
            guestCount={activeOrder.guestCount}
            allowSetMenu={false}
            submitLabel={(amount) => `Thêm vào order (+${formatVnd(amount)})`}
            errorMessage={submitError}
            isSubmitting={addItemsMutation.isPending}
            onSubmit={({ items }) => {
              setSubmitError(null)
              addItemsMutation.mutate(items)
            }}
          />
        </>
      )}
    </div>
  )
}
