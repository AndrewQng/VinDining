import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  computeKdsRowsPerPage,
  formatMinutesSeconds,
  groupKitchenTickets,
  paginateKdsLanes,
  type GroupedKitchenTicket,
} from '@/domain'
import { StatusBadge } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'
import { orderApi } from '@/services/api'
import { useRealtime } from '@/services/realtime'

function formatWallClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function getKdsCardBorderClass(ticket: GroupedKitchenTicket): string {
  if (ticket.lane === 'remake' || ticket.slaStatus === 'overdue') {
    return 'border-danger/70'
  }
  if (ticket.lane === 'cooking' && ticket.slaStatus === 'warning') {
    return 'border-warning/70'
  }
  if (ticket.lane === 'cooking') {
    return 'border-primary/60'
  }
  return 'border-line'
}

function getCountdownBoxStyle(ticket: GroupedKitchenTicket): string {
  if (ticket.slaStatus === 'overdue') {
    return 'bg-danger/15 border-danger/50 text-danger'
  }
  if (ticket.slaStatus === 'warning') {
    return 'bg-warning/15 border-warning/50 text-warning'
  }
  return 'bg-success/15 border-success/50 text-success'
}

/** K1, K1b, K1p, K1p2 — Hands-free wall KDS display with 3 lanes and height-computed pagination. */
export function KdsBoardPage() {
  useDocumentTitle('KDS Bếp')
  const queryClient = useQueryClient()
  const [now, setNow] = useState(() => new Date())
  const [pageIndex, setPageIndex] = useState(1)
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 1080
  )

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const onResize = () => setViewportHeight(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const { data: pendingItems = [] } = useQuery({
    queryKey: ['kitchen-pending'],
    queryFn: () => orderApi.getKitchenPending(),
  })

  useRealtime('order:updated', () => {
    void queryClient.invalidateQueries({ queryKey: ['kitchen-pending'] })
  })
  useRealtime('course:activated', () => {
    void queryClient.invalidateQueries({ queryKey: ['kitchen-pending'] })
  })
  useRealtime('item:served', () => {
    void queryClient.invalidateQueries({ queryKey: ['kitchen-pending'] })
  })
  useRealtime('item:remake-requested', () => {
    void queryClient.invalidateQueries({ queryKey: ['kitchen-pending'] })
  })

  const grouped = useMemo(
    () => groupKitchenTickets(pendingItems, now),
    [pendingItems, now]
  )

  const rowsPerPage = computeKdsRowsPerPage(viewportHeight)
  const board = useMemo(
    () => paginateKdsLanes(grouped, pageIndex, rowsPerPage),
    [grouped, pageIndex, rowsPerPage]
  )

  const onHoldTitleSuffix =
    board.onHoldLaterCount > 0 ? ` · ${board.onHoldLaterCount} ở trang sau` : ''
  const cookingTitleSuffix =
    board.cookingLaterCount > 0
      ? ` · ${board.cookingLaterCount} ở trang sau`
      : ''

  return (
    <div className="min-h-screen flex flex-col gap-4 p-4 lg:p-6 bg-bg text-ink">
      <header className="rounded-2xl bg-surface border border-line px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl lg:text-3xl font-black tracking-wide text-accent">
          KDS BẾP
        </h1>

        <div className="flex flex-wrap items-center gap-6">
          <p className="text-base lg:text-lg font-bold text-ink tabular-nums">
            Làm lại {board.remake.length} · Đang nấu {board.cookingTotal} · Chờ{' '}
            {board.onHoldTotal}
          </p>
          <span
            data-testid="kds-clock"
            className="text-2xl lg:text-3xl font-black text-ink tabular-nums"
          >
            {formatWallClock(now)}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        <section
          aria-label="Làm lại"
          data-testid="kds-lane-remake"
          className="lg:col-span-3 rounded-2xl bg-surface border border-danger/50 p-4 flex flex-col gap-3"
        >
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-base lg:text-lg font-black text-danger tracking-wide">
              LÀM LẠI
            </h2>
            <span className="text-sm font-bold text-danger tabular-nums">
              {board.remake.length} ticket
            </span>
          </div>

          {board.remake.length === 0 ? (
            <p className="text-sm text-ink-muted py-4">Không có ticket</p>
          ) : (
            <div className="space-y-3">
              {board.remake.map((ticket) => (
                <KdsTicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </section>

        <section
          aria-label="Đang nấu"
          data-testid="kds-lane-cooking"
          className="lg:col-span-6 rounded-2xl bg-surface border border-primary/50 p-4 flex flex-col gap-3"
        >
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-base lg:text-lg font-black text-accent tracking-wide">
              ĐANG NẤU
            </h2>
            <span className="text-sm font-bold text-accent tabular-nums">
              {board.cookingTotal} ticket{cookingTitleSuffix}
            </span>
          </div>

          {board.cooking.length === 0 ? (
            <p className="text-sm text-ink-muted py-4">Không có ticket</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {board.cooking.map((ticket) => (
                <KdsTicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </section>

        <section
          aria-label="Chờ"
          data-testid="kds-lane-onhold"
          className="lg:col-span-3 rounded-2xl bg-surface border border-line p-4 flex flex-col gap-3"
        >
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-base lg:text-lg font-black text-ink-muted tracking-wide">
              CHỜ
            </h2>
            <span className="text-sm font-bold text-ink-muted tabular-nums">
              {board.onHoldTotal} ticket{onHoldTitleSuffix}
            </span>
          </div>

          {board.onHold.length === 0 ? (
            <p className="text-sm text-ink-muted py-4">Không có ticket</p>
          ) : (
            <div className="space-y-3">
              {board.onHold.map((ticket) => (
                <KdsTicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </section>
      </div>

      {board.totalPages > 1 && (
        <footer
          aria-label="Phân trang KDS"
          className="rounded-2xl bg-surface border border-line px-6 py-3 flex items-center justify-between gap-4"
        >
          <span
            data-testid="kds-page-indicator"
            className="text-lg lg:text-xl font-bold text-ink tabular-nums"
          >
            Trang {board.page} / {board.totalPages}
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={board.page <= 1}
              onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
              className="min-h-[72px] px-7 rounded-xl border border-line bg-card text-lg font-bold text-ink hover:bg-card-hover disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              ‹ Trang trước
            </button>
            <button
              type="button"
              disabled={board.page >= board.totalPages}
              onClick={() =>
                setPageIndex((p) => Math.min(board.totalPages, p + 1))
              }
              className="min-h-[72px] px-7 rounded-xl border border-primary bg-primary/15 text-lg font-bold text-accent hover:bg-primary/25 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Trang sau ›
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}

function KdsTicketCard({ ticket }: { ticket: GroupedKitchenTicket }) {
  const isOnHold = ticket.lane === 'onhold'
  const isRemake = ticket.lane === 'remake'
  const courseNumber =
    ticket.courseKey === 'Course2' ? 2 : ticket.courseKey === 'Course3' ? 3 : 1
  const overdue = ticket.remainingSeconds < 0

  return (
    <article
      data-testid={`kds-ticket-${ticket.tableNumber}-${ticket.courseKey}-${ticket.lane}`}
      data-sla-status={ticket.slaStatus}
      className={cn(
        'rounded-xl bg-card border-2 p-4 flex flex-col justify-between gap-3 min-h-[196px]',
        getKdsCardBorderClass(ticket)
      )}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xl lg:text-2xl font-black text-ink">
            BÀN {ticket.tableNumber}
          </h3>
          <StatusBadge
            status={isOnHold ? 'OnHold' : 'Cooking'}
            isRemake={isRemake}
          />
        </div>

        <p className="text-sm lg:text-base font-semibold text-accent">
          {ticket.courseTitle}
        </p>

        <ul className="space-y-1">
          {ticket.items.map((item) => (
            <li key={item.orderItemId} className="text-base lg:text-lg font-bold text-ink">
              <span>
                {item.quantity}× {item.itemName}
              </span>
              {item.note && (
                <p className="text-xs lg:text-sm font-semibold text-accent mt-0.5">
                  Ghi chú: {item.note}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>

      {isOnHold ? (
        <div className="rounded-lg bg-surface border border-line px-3.5 py-2.5 text-sm font-medium text-ink-muted">
          Chờ kích hoạt Course {courseNumber}
        </div>
      ) : (
        <div
          className={cn(
            'rounded-lg border px-3.5 py-2 flex items-center justify-between gap-2 tabular-nums',
            getCountdownBoxStyle(ticket)
          )}
        >
          <span className="text-sm font-semibold">
            {overdue ? 'Quá định mức' : 'Còn lại'}
          </span>
          <span className="text-lg lg:text-xl font-black">
            {overdue
              ? `+${formatMinutesSeconds(ticket.remainingSeconds)}`
              : formatMinutesSeconds(ticket.remainingSeconds)}
          </span>
        </div>
      )}
    </article>
  )
}
