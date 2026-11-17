import { realtimeClient } from '@/services/realtime/client'
import type {
  CreateServiceRequestInput,
  FeedbackDto,
  ServiceRequestDto,
  SubmitFeedbackRequest,
} from '@/types'
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
      const invoice = db.invoices.find(
        (inv) => inv.surveyToken === input.token
      )
      const fb: FeedbackDto = {
        id: nextMockId('fb'),
        reservationId: null,
        invoiceId: invoice?.id ?? null,
        guestName: null,
        tableNumber: invoice?.tableNumber ?? null,
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
    handler: ({ db }) => ok(db.feedbacks),
  },
]
