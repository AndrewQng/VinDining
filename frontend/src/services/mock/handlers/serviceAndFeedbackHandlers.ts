import { realtimeClient } from '@/services/realtime/client'
import type {
  CreateServiceRequestInput,
  FeedbackDto,
  ServiceRequestDto,
  SubmitFeedbackRequest,
} from '@/types'
import { getHistorical120DayData } from '../historicalSeed'
import { nextMockId, saveMockDb } from '../db'
import { fail, ok, type MockRouteDefinition } from '../types'

export const serviceAndFeedbackRoutes: MockRouteDefinition[] = [
  {
    id: 33,
    method: 'POST',
    pattern: '/tables/:id/call-service',
    access: 'Guest',
    handler: ({ db, params, body, now }) => {
      const table = db.tables.find((t) => t.id === params.id && t.isActive)
      if (!table) return fail(404, 'Không tìm thấy bàn')
      if (table.status !== 'Occupied' && table.status !== 'PaymentPending') {
        return fail(409, 'Bàn chưa check-in, không thể gửi yêu cầu')
      }
      const { requestType } = body as CreateServiceRequestInput
      const alreadyPending = db.serviceRequests.some(
        (s) =>
          s.tableId === table.id &&
          s.requestType === requestType &&
          s.status === 'Pending'
      )
      if (alreadyPending) {
        return fail(409, 'Yêu cầu này đã được gửi và đang chờ phục vụ xử lý')
      }
      const item: ServiceRequestDto = {
        id: nextMockId('sr'),
        tableId: table.id,
        tableNumber: table.tableNumber,
        requestType,
        status: 'Pending',
        completedById: null,
        completedAt: null,
        createdAt: now.toISOString(),
      }
      db.serviceRequests.unshift(item)
      saveMockDb(db)

      realtimeClient.publish('service-request:created', {
        requestId: item.id,
        tableId: table.id,
        tableNumber: table.tableNumber,
        requestType,
      })
      return ok(item, 201)
    },
  },
  {
    id: 34,
    method: 'PATCH',
    pattern: '/service-calls/:id/complete',
    access: ['Waitstaff', 'Manager'],
    handler: ({ db, params, user, now }) => {
      const item = db.serviceRequests.find((s) => s.id === params.id)
      if (!item) return fail(404, 'Không tìm thấy yêu cầu phục vụ')
      item.status = 'Completed'
      item.completedById = user?.id ?? null
      item.completedAt = now.toISOString()
      saveMockDb(db)

      realtimeClient.publish('service-request:completed', {
        requestId: item.id,
        tableId: item.tableId,
      })
      return ok(item)
    },
  },
  {
    id: 35,
    method: 'GET',
    pattern: '/service-calls/active',
    access: ['Waitstaff', 'Manager'],
    handler: ({ db }) =>
      ok(db.serviceRequests.filter((s) => s.status === 'Pending')),
  },
  {
    id: 36,
    method: 'POST',
    pattern: '/feedbacks',
    access: 'Guest',
    handler: ({ db, body, now }) => {
      const input = body as SubmitFeedbackRequest
      const token = (input.token ?? '').trim()
      const invoice = db.invoices.find((inv) => inv.surveyToken === token)
      if (!invoice) {
        return fail(404, 'Liên kết đánh giá không hợp lệ hoặc đã hết hạn')
      }
      const alreadySubmitted = db.feedbacks.some(
        (fb) => fb.invoiceId === invoice.id
      )
      if (alreadySubmitted) {
        return fail(409, 'Quý khách đã hoàn tất đánh giá cho hóa đơn này trước đó')
      }
      const ratings = [
        input.foodRating,
        input.ambienceRating,
        input.serviceRating,
      ]
      if (ratings.some((r) => !Number.isInteger(r) || r < 1 || r > 5)) {
        return fail(400, 'Vui lòng chấm điểm từ 1 đến 5 sao cho cả 3 tiêu chí')
      }
      const fb: FeedbackDto = {
        id: nextMockId('fb'),
        reservationId: null,
        invoiceId: invoice.id,
        guestName: null,
        tableNumber: invoice.tableNumber,
        foodRating: input.foodRating,
        ambienceRating: input.ambienceRating,
        serviceRating: input.serviceRating,
        comment: input.comment?.trim() || null,
        createdAt: now.toISOString(),
      }
      db.feedbacks.unshift(fb)
      saveMockDb(db)
      return ok(fb, 201)
    },
  },
  {
    id: 37,
    method: 'GET',
    pattern: '/manager/feedbacks',
    access: ['Manager'],
    handler: ({ db, now }) => {
      const history = getHistorical120DayData(now)
      const merged = [...db.feedbacks, ...history.feedbacks].sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
      )
      return ok(merged)
    },
  },
]
