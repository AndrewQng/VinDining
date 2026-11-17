import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { GripVertical, Plus, Printer, QrCode, Save, Trash2 } from 'lucide-react'
import QRCode from 'qrcode'
import { TABLE_ZONE_LABELS, validateFloorPlanLayout } from '@/domain'
import {
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Skeleton,
  StatusBadge,
  Tabs,
} from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'
import { managerApi, tableApi } from '@/services/api'
import { useToastStore } from '@/stores/useToastStore'
import type { ApiErrorResponse, TableDto, TableZone } from '@/types'

const SNAP_GRID = 20
const CANVAS_W = 680
const CANVAS_H = 580
const NODE_W = 132
const NODE_H = 104

const ZONES: TableZone[] = ['MainHall', 'VIP', 'Balcony']

function snap(value: number, max: number): number {
  const snapped = Math.round(value / SNAP_GRID) * SNAP_GRID
  return Math.max(20, Math.min(max, snapped))
}

/** M2 / M2x — Cấu hình sơ đồ bàn 2D theo khu vực, kéo thả + phím mũi tên + QR tự động. */
export function ManagerFloorPlanPage() {
  useDocumentTitle('Cấu hình sơ đồ bàn')
  const queryClient = useQueryClient()
  const pushToast = useToastStore((s) => s.push)
  const [zone, setZone] = useState<TableZone>('MainHall')
  const [drafts, setDrafts] = useState<Record<string, TableDto>>({})
  const [selectedId, setSelectedId] = useState<string>('')
  const [hasUnsaved, setHasUnsaved] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    tableId: string
    startX: number
    startY: number
    origX: number
    origY: number
  } | null>(null)

  const tablesQuery = useQuery({
    queryKey: ['tables'],
    queryFn: tableApi.getAll,
  })

  useEffect(() => {
    if (!tablesQuery.data || hasUnsaved) return
    const next: Record<string, TableDto> = {}
    for (const t of tablesQuery.data) {
      next[t.id] = { ...t }
    }
    setDrafts(next)
  }, [tablesQuery.data, hasUnsaved])

  const zoneTables = useMemo(
    () =>
      Object.values(drafts)
        .filter((t) => t.isActive && t.zone === zone)
        .sort((a, b) => a.tableNumber.localeCompare(b.tableNumber)),
    [drafts, zone]
  )

  const selectedTable =
    (selectedId && drafts[selectedId]?.zone === zone ? drafts[selectedId] : null) ??
    zoneTables[0] ??
    null

  const saveLayoutMutation = useMutation({
    mutationFn: () => {
      const positions = Object.values(drafts).map((t) => ({
        tableId: t.id,
        posX: t.posX,
        posY: t.posY,
        capacity: t.capacity,
        zone: t.zone,
        tableNumber: t.tableNumber,
      }))
      const check = validateFloorPlanLayout(positions)
      if (!check.valid) {
        throw new Error(Object.values(check.errors)[0] ?? 'Dữ liệu sơ đồ không hợp lệ')
      }
      return managerApi.saveFloorPlanLayout({ positions })
    },
    onSuccess: (updated) => {
      const next: Record<string, TableDto> = {}
      for (const t of updated) next[t.id] = { ...t }
      setDrafts(next)
      setHasUnsaved(false)
      void queryClient.invalidateQueries({ queryKey: ['tables'] })
      pushToast({ variant: 'success', title: 'Đã lưu cấu hình sơ đồ bàn' })
    },
    onError: (err) => {
      pushToast({
        variant: 'error',
        title: 'Không thể lưu sơ đồ',
        description: (err as Error).message,
      })
    },
  })

  const deleteTableMutation = useMutation({
    mutationFn: (id: string) => managerApi.deleteTable(id),
    onSuccess: (_res, id) => {
      setConfirmDeleteOpen(false)
      setDeleteError(null)
      setDrafts((prev) => {
        const copy = { ...prev }
        delete copy[id]
        return copy
      })
      setSelectedId('')
      void queryClient.invalidateQueries({ queryKey: ['tables'] })
      pushToast({ variant: 'success', title: 'Đã xóa bàn khỏi sơ đồ' })
    },
    onError: (err) => {
      setConfirmDeleteOpen(false)
      setDeleteError(
        isAxiosError<ApiErrorResponse>(err)
          ? (err.response?.data?.message ?? 'Không thể xóa bàn này')
          : 'Không thể xóa bàn này'
      )
    },
  })

  const updateSelectedField = <K extends keyof TableDto>(
    key: K,
    value: TableDto[K]
  ) => {
    if (!selectedTable) return
    setHasUnsaved(true)
    setDeleteError(null)
    setDrafts((prev) => ({
      ...prev,
      [selectedTable.id]: {
        ...prev[selectedTable.id],
        [key]: value,
      },
    }))
  }

  const handleKeyMove = (table: TableDto, e: React.KeyboardEvent) => {
    const stepMap: Record<string, [number, number]> = {
      ArrowLeft: [-SNAP_GRID, 0],
      ArrowRight: [SNAP_GRID, 0],
      ArrowUp: [0, -SNAP_GRID],
      ArrowDown: [0, SNAP_GRID],
    }
    const delta = stepMap[e.key]
    if (!delta) return
    e.preventDefault()
    const nextX = snap(table.posX + delta[0], CANVAS_W - NODE_W - 20)
    const nextY = snap(table.posY + delta[1], CANVAS_H - NODE_H - 20)
    setHasUnsaved(true)
    setDrafts((prev) => ({
      ...prev,
      [table.id]: { ...prev[table.id], posX: nextX, posY: nextY },
    }))
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const nextX = snap(
      drag.origX + (e.clientX - drag.startX),
      CANVAS_W - NODE_W - 20
    )
    const nextY = snap(
      drag.origY + (e.clientY - drag.startY),
      CANVAS_H - NODE_H - 20
    )
    setHasUnsaved(true)
    setDrafts((prev) => ({
      ...prev,
      [drag.tableId]: { ...prev[drag.tableId], posX: nextX, posY: nextY },
    }))
  }

  const stopDragging = () => {
    dragRef.current = null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">
            Cấu hình sơ đồ bàn
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Kéo thả hoặc dùng phím mũi tên để định vị bàn, sức chứa và mã QR gọi
            món tại bàn
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setAddOpen(true)}
          >
            Thêm bàn
          </Button>
          <Button
            type="button"
            variant="primary"
            icon={<Save className="w-4 h-4" />}
            disabled={!hasUnsaved}
            loading={saveLayoutMutation.isPending}
            onClick={() => saveLayoutMutation.mutate()}
          >
            Lưu sơ đồ
          </Button>
        </div>
      </div>

      <Tabs
        value={zone}
        onChange={(nextZone) => {
          setZone(nextZone)
          setDeleteError(null)
        }}
        items={ZONES.map((z) => ({
          value: z,
          label: `${TABLE_ZONE_LABELS[z]} (${
            Object.values(drafts).filter((t) => t.isActive && t.zone === z)
              .length
          })`,
        }))}
      />

      {deleteError && (
        <div
          role="alert"
          data-testid="m2x-delete-error"
          className="rounded-xl border border-danger/50 bg-danger/10 px-4 py-3 text-sm font-medium text-danger"
        >
          {deleteError}
        </div>
      )}

      {tablesQuery.isLoading ? (
        <Skeleton className="h-[520px] w-full rounded-xl" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr] items-start">
          <Card className="space-y-3">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span className="font-semibold text-ink">
                Khu vực: {TABLE_ZONE_LABELS[zone]} ({zoneTables.length} bàn)
              </span>
              <span>Lưới {SNAP_GRID}px · Kéo thả hoặc dùng phím mũi tên</span>
            </div>

            <div
              ref={canvasRef}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDragging}
              onPointerLeave={stopDragging}
              className="relative w-full overflow-x-auto rounded-xl border border-line bg-bg"
              style={{ height: `${CANVAS_H}px`, minHeight: `${CANVAS_H}px` }}
            >
              <div
                className="relative h-full"
                style={{
                  minWidth: `${CANVAS_W}px`,
                  backgroundImage:
                    'radial-gradient(circle, var(--line-strong) 1px, transparent 1px)',
                  backgroundSize: `${SNAP_GRID}px ${SNAP_GRID}px`,
                }}
              >
                {zoneTables.map((table) => {
                  const selected = selectedTable?.id === table.id
                  return (
                    <div
                      key={table.id}
                      role="button"
                      tabIndex={0}
                      data-testid={`floor-node-${table.tableNumber}`}
                      onClick={() => {
                        setSelectedId(table.id)
                        setDeleteError(null)
                      }}
                      onKeyDown={(e) => handleKeyMove(table, e)}
                      onPointerDown={(e) => {
                        setSelectedId(table.id)
                        setDeleteError(null)
                        dragRef.current = {
                          tableId: table.id,
                          startX: e.clientX,
                          startY: e.clientY,
                          origX: table.posX,
                          origY: table.posY,
                        }
                      }}
                      style={{
                        left: `${Math.min(CANVAS_W - NODE_W - 20, Math.max(16, table.posX))}px`,
                        top: `${Math.min(CANVAS_H - NODE_H - 20, Math.max(16, table.posY))}px`,
                        width: `${NODE_W}px`,
                        height: `${NODE_H}px`,
                      }}
                      className={cn(
                        'absolute select-none rounded-xl border p-2.5 flex flex-col justify-between transition-shadow cursor-grab active:cursor-grabbing',
                        selected
                          ? 'border-accent bg-card ring-2 ring-accent/40 shadow-lg'
                          : 'border-line bg-surface hover:border-accent/60'
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-ink">
                          <GripVertical className="w-3.5 h-3.5 text-ink-subtle" />
                          {table.tableNumber}
                        </span>
                        <span className="rounded bg-card px-1.5 py-0.5 text-[11px] font-medium text-ink-muted tabular-nums">
                          {table.capacity} ghế
                        </span>
                      </div>
                      <div className="flex items-center">
                        <StatusBadge status={table.status} />
                      </div>
                      <span className="text-[10px] font-mono text-ink-subtle tabular-nums">
                        {table.posX}, {table.posY} px
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>

          <Card className="space-y-5">
            {selectedTable ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-lg font-bold text-ink">
                    Chi tiết Bàn {selectedTable.tableNumber}
                  </h2>
                  <StatusBadge status={selectedTable.status} />
                </div>

                <div className="space-y-3.5">
                  <Input
                    label="Số hiệu bàn"
                    value={selectedTable.tableNumber}
                    onChange={(e) =>
                      updateSelectedField('tableNumber', e.target.value.toUpperCase())
                    }
                  />
                  <Input
                    label="Số ghế (sức chứa)"
                    type="number"
                    min={1}
                    max={20}
                    value={String(selectedTable.capacity)}
                    onChange={(e) =>
                      updateSelectedField(
                        'capacity',
                        Math.max(1, Math.min(20, Math.round(Number(e.target.value) || 1)))
                      )
                    }
                  />
                  <div className="space-y-1.5">
                    <label
                      htmlFor="inspector-zone"
                      className="block text-xs font-medium text-ink-muted"
                    >
                      Khu vực
                    </label>
                    <select
                      id="inspector-zone"
                      value={selectedTable.zone}
                      onChange={(e) =>
                        updateSelectedField('zone', e.target.value as TableZone)
                      }
                      className="h-10 w-full rounded-lg border border-line bg-card px-3 text-sm text-ink"
                    >
                      {ZONES.map((z) => (
                        <option key={z} value={z}>
                          {TABLE_ZONE_LABELS[z]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <TableQrCard
                  table={selectedTable}
                  onOpenPrintModal={() => setQrModalOpen(true)}
                />

                <Button
                  type="button"
                  variant="danger"
                  className="w-full"
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  Xóa bàn {selectedTable.tableNumber}
                </Button>
              </>
            ) : (
              <EmptyState
                title="Chưa có bàn nào trong khu vực"
                description="Bấm Thêm bàn để tạo bàn mới."
              />
            )}
          </Card>
        </div>
      )}

      <AddTableModal
        open={addOpen}
        defaultZone={zone}
        onClose={() => setAddOpen(false)}
        onCreated={(created) => {
          setAddOpen(false)
          setZone(created.zone)
          setSelectedId(created.id)
          setDrafts((prev) => ({ ...prev, [created.id]: created }))
          void queryClient.invalidateQueries({ queryKey: ['tables'] })
          pushToast({
            variant: 'success',
            title: `Đã thêm bàn ${created.tableNumber}`,
          })
        }}
      />

      {selectedTable && (
        <Modal
          open={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          title={`Mã QR gọi món · Bàn ${selectedTable.tableNumber}`}
          size="sm"
        >
          <TableQrPrintPreview table={selectedTable} />
        </Modal>
      )}

      <Modal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title={`Xóa bàn ${selectedTable?.tableNumber ?? ''}`}
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleteTableMutation.isPending}
              onClick={() => {
                if (selectedTable) {
                  deleteTableMutation.mutate(selectedTable.id)
                }
              }}
            >
              Xác nhận xóa
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          Xóa bàn <strong className="text-ink">{selectedTable?.tableNumber}</strong>{' '}
          khỏi sơ đồ khu vực {selectedTable ? TABLE_ZONE_LABELS[selectedTable.zone] : ''}?
        </p>
      </Modal>
    </div>
  )
}

function TableQrCard({
  table,
  onOpenPrintModal,
}: {
  table: TableDto
  onOpenPrintModal: () => void
}) {
  const [qrUrl, setQrUrl] = useState('')
  const menuPath = `${window.location.origin}/menu/${table.qrCode}`

  useEffect(() => {
    let active = true
    void QRCode.toDataURL(menuPath, { width: 120, margin: 1 })
      .then((url) => {
        if (active) setQrUrl(url)
      })
      .catch(() => {
        if (active) setQrUrl('')
      })
    return () => {
      active = false
    }
  }, [menuPath])

  return (
    <div className="rounded-xl border border-line bg-card p-3.5 flex items-center gap-3.5">
      {qrUrl ? (
        <img
          src={qrUrl}
          alt={`QR bàn ${table.tableNumber}`}
          className="h-20 w-20 rounded border border-line bg-white p-1 shrink-0"
        />
      ) : (
        <div className="h-20 w-20 rounded border border-line bg-surface flex items-center justify-center shrink-0">
          <QrCode className="w-6 h-6 text-ink-subtle" />
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <p className="text-xs font-semibold text-ink">
            Mã QR bàn {table.tableNumber} (Tự động tạo)
          </p>
          <p className="text-[11px] font-mono text-ink-muted truncate">
            /menu/{table.qrCode}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={<QrCode className="w-3.5 h-3.5" />}
          onClick={onOpenPrintModal}
        >
          Xem / In mã QR
        </Button>
      </div>
    </div>
  )
}

function TableQrPrintPreview({ table }: { table: TableDto }) {
  const [qrUrl, setQrUrl] = useState('')
  const menuPath = `${window.location.origin}/menu/${table.qrCode}`

  useEffect(() => {
    let active = true
    void QRCode.toDataURL(menuPath, { width: 220, margin: 2 }).then((url) => {
      if (active) setQrUrl(url)
    })
    return () => {
      active = false
    }
  }, [menuPath])

  return (
    <div className="space-y-4">
      <div
        data-testid="m2-qr-preview"
        className="print-slip-area mx-auto w-[280px] rounded-xl border border-line bg-white p-5 text-center text-[#111827] space-y-2.5"
      >
        <p className="font-serif text-lg font-bold">VinDining</p>
        <p className="text-sm font-bold">
          Bàn {table.tableNumber} · {TABLE_ZONE_LABELS[table.zone]}
        </p>
        {qrUrl && (
          <img
            src={qrUrl}
            alt={`QR ${table.qrCode}`}
            className="mx-auto h-44 w-44 rounded border border-[#e5e7eb] p-1"
          />
        )}
        <p className="text-xs font-medium text-[#374151]">
          Quét mã để xem thực đơn & gọi phục vụ
        </p>
        <a
          href={`/menu/${table.qrCode}`}
          className="no-print block text-xs font-mono text-[#1d4ed8] underline"
        >
          /menu/{table.qrCode}
        </a>
      </div>

      <div className="no-print flex justify-end gap-2">
        <Button
          type="button"
          variant="primary"
          icon={<Printer className="w-4 h-4" />}
          onClick={() => window.print()}
        >
          In mã QR
        </Button>
      </div>
    </div>
  )
}

function AddTableModal({
  open,
  defaultZone,
  onClose,
  onCreated,
}: {
  open: boolean
  defaultZone: TableZone
  onClose: () => void
  onCreated: (table: TableDto) => void
}) {
  const [tableNumber, setTableNumber] = useState('')
  const [capacity, setCapacity] = useState('4')
  const [zone, setZone] = useState<TableZone>(defaultZone)
  const [error, setError] = useState<string | null>(null)

  const [lastOpen, setLastOpen] = useState(false)
  if (open && !lastOpen) {
    setLastOpen(true)
    setTableNumber('')
    setCapacity('4')
    setZone(defaultZone)
    setError(null)
  } else if (!open && lastOpen) {
    setLastOpen(false)
  }

  const mutation = useMutation({
    mutationFn: () =>
      managerApi.createTable({
        tableNumber: tableNumber.trim().toUpperCase(),
        capacity: Math.round(Number(capacity)),
        zone,
        posX: 380,
        posY: 320,
      }),
    onSuccess: onCreated,
    onError: (err) => {
      setError(
        isAxiosError<ApiErrorResponse>(err)
          ? (err.response?.data?.message ?? 'Không thể tạo bàn mới')
          : 'Không thể tạo bàn mới'
      )
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!tableNumber.trim()) {
      setError('Vui lòng nhập số hiệu bàn')
      return
    }
    const cap = Math.round(Number(capacity))
    if (!Number.isInteger(cap) || cap < 1 || cap > 20) {
      setError('Số ghế phải từ 1 đến 20')
      return
    }
    mutation.mutate()
  }

  return (
    <Modal open={open} onClose={onClose} title="Thêm bàn mới" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Số hiệu bàn"
          placeholder="Ví dụ: B09"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value.toUpperCase())}
        />
        <Input
          label="Số ghế"
          type="number"
          min={1}
          max={20}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />
        <div className="space-y-1.5">
          <label
            htmlFor="add-table-zone"
            className="block text-xs font-medium text-ink-muted"
          >
            Khu vực
          </label>
          <select
            id="add-table-zone"
            value={zone}
            onChange={(e) => setZone(e.target.value as TableZone)}
            className="h-10 w-full rounded-lg border border-line bg-card px-3 text-sm text-ink"
          >
            {ZONES.map((z) => (
              <option key={z} value={z}>
                {TABLE_ZONE_LABELS[z]}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={mutation.isPending}
          >
            Tạo bàn & sinh QR
          </Button>
        </div>
      </form>
    </Modal>
  )
}
