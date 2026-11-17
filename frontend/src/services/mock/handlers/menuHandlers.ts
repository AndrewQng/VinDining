import type {
  CreateMenuItemRequest,
  CreateTastingMenuRequest,
  MenuItemDto,
  TastingMenuDto,
  ToggleAvailabilityRequest,
  UpdateMenuItemRequest,
  UpdateTastingMenuRequest,
} from '@/types'
import { nextMockId, saveMockDb } from '../db'
import { fail, ok, type MockRouteDefinition } from '../types'

export const extraPublicMenuRoutes: MockRouteDefinition[] = [
  {
    id: 101,
    method: 'GET',
    pattern: '/menu/tasting-menus',
    access: 'Public',
    handler: ({ db }) => ok(db.tastingMenus.filter((m) => m.isActive)),
  },
]

export const menuRoutes: MockRouteDefinition[] = [
  {
    id: 30,
    method: 'GET',
    pattern: '/menu/table/:id',
    access: 'Guest',
    handler: ({ db, params }) => {
      const key = params.id.trim()
      const table = db.tables.find(
        (t) =>
          t.isActive &&
          (t.id === key ||
            t.qrCode.toLowerCase() === key.toLowerCase() ||
            t.tableNumber.toLowerCase() === key.toLowerCase())
      )
      if (!table) {
        return fail(
          404,
          'Mã QR không hợp lệ hoặc bàn chưa được nhận. Vui lòng liên hệ nhân viên phục vụ.'
        )
      }
      if (table.status !== 'Occupied' && table.status !== 'PaymentPending') {
        return fail(
          409,
          'Mã QR không hợp lệ hoặc bàn chưa được nhận. Vui lòng liên hệ nhân viên phục vụ.'
        )
      }
      return ok({
        tableId: table.id,
        tableNumber: table.tableNumber,
        isCheckedIn: true,
        tastingMenus: db.tastingMenus.filter((m) => m.isActive),
        categories: db.categories.filter((c) => c.isActive),
        items: db.menuItems,
      })
    },
  },
  {
    id: 31,
    method: 'GET',
    pattern: '/menu/categories',
    access: 'Public',
    handler: ({ db }) =>
      ok(
        db.categories
          .filter((c) => c.isActive)
          .map((cat) => ({
            ...cat,
            items: db.menuItems.filter((m) => m.categoryId === cat.id),
          }))
      ),
  },
  {
    id: 32,
    method: 'GET',
    pattern: '/menu/items/:id',
    access: 'Public',
    handler: ({ db, params }) => {
      const item = db.menuItems.find((m) => m.id === params.id)
      if (!item) return fail(404, 'Không tìm thấy món ăn')
      return ok(item)
    },
  },
  {
    id: 42,
    method: 'GET',
    pattern: '/manager/menu-items',
    access: ['Manager'],
    handler: ({ db, query }) => {
      const search = (query.get('search') || '').trim().toLowerCase()
      const items = search
        ? db.menuItems.filter((m) => m.name.toLowerCase().includes(search))
        : db.menuItems
      return ok(items)
    },
  },
  {
    id: 38,
    method: 'POST',
    pattern: '/manager/menu-items',
    access: ['Manager'],
    handler: ({ db, body, now }) => {
      const input = body as CreateMenuItemRequest
      const name = input.name.trim()
      if (!name || input.price <= 0) {
        return fail(400, 'Tên món và đơn giá phải hợp lệ')
      }
      const dup = db.menuItems.some(
        (m) => m.name.toLowerCase() === name.toLowerCase()
      )
      if (dup) {
        return fail(409, 'Tên món ăn đã tồn tại trong thực đơn')
      }

      const item: MenuItemDto = {
        id: nextMockId('item'),
        categoryId: input.categoryId,
        name,
        description: input.description?.trim() || null,
        price: Math.round(input.price),
        imageUrl: input.imageUrl ?? null,
        status: input.status ?? 'Available',
        prepTimeMinutes: input.prepTimeMinutes,
        courseType: input.courseType,
        createdAt: now.toISOString(),
      }
      db.menuItems.push(item)
      saveMockDb(db)
      return ok(item, 201)
    },
  },
  {
    id: 39,
    method: 'PUT',
    pattern: '/manager/menu-items/:id',
    access: ['Manager'],
    handler: ({ db, params, body }) => {
      const item = db.menuItems.find((m) => m.id === params.id)
      if (!item) return fail(404, 'Không tìm thấy món ăn')
      const input = body as UpdateMenuItemRequest
      const name = input.name.trim()
      if (!name || input.price <= 0) {
        return fail(400, 'Tên món và đơn giá phải hợp lệ')
      }
      const dup = db.menuItems.some(
        (m) => m.id !== item.id && m.name.toLowerCase() === name.toLowerCase()
      )
      if (dup) {
        return fail(409, 'Tên món ăn đã tồn tại trong thực đơn')
      }

      item.name = name
      item.description = input.description?.trim() || null
      item.price = Math.round(input.price)
      item.prepTimeMinutes = input.prepTimeMinutes
      item.courseType = input.courseType
      if (input.categoryId) item.categoryId = input.categoryId
      if (input.imageUrl !== undefined) item.imageUrl = input.imageUrl
      saveMockDb(db)
      return ok(item)
    },
  },
  {
    id: 40,
    method: 'PATCH',
    pattern: '/manager/menu-items/:id/availability',
    access: ['Manager'],
    handler: ({ db, params, body }) => {
      const item = db.menuItems.find((m) => m.id === params.id)
      if (!item) return fail(404, 'Không tìm thấy món ăn')
      const { status } = body as ToggleAvailabilityRequest
      item.status = status
      saveMockDb(db)
      return ok(item)
    },
  },
  {
    id: 41,
    method: 'DELETE',
    pattern: '/manager/menu-items/:id',
    access: ['Manager'],
    handler: ({ db, params }) => {
      const idx = db.menuItems.findIndex((m) => m.id === params.id)
      if (idx === -1) return fail(404, 'Không tìm thấy món ăn')
      db.menuItems.splice(idx, 1)
      saveMockDb(db)
      return ok({ deleted: true })
    },
  },
  {
    id: 46,
    method: 'GET',
    pattern: '/manager/tasting-menus',
    access: ['Manager'],
    handler: ({ db }) => ok(db.tastingMenus),
  },
  {
    id: 43,
    method: 'POST',
    pattern: '/manager/tasting-menus',
    access: ['Manager'],
    handler: ({ db, body, now }) => {
      const input = body as CreateTastingMenuRequest
      const id = nextMockId('set')
      const setMenu: TastingMenuDto = {
        id,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        price: Math.round(input.price),
        imageUrl: input.imageUrl ?? null,
        isActive: input.isActive ?? true,
        createdAt: now.toISOString(),
        items: input.items.map((row) => {
          const dish = db.menuItems.find((m) => m.id === row.menuItemId)
          return {
            id: nextMockId('smi'),
            tastingMenuId: id,
            menuItemId: row.menuItemId,
            menuItemName: dish?.name ?? 'Món ăn',
            courseOrder: row.courseOrder,
            courseType: row.courseType,
            prepTimeMinutes: dish?.prepTimeMinutes ?? 15,
          }
        }),
      }
      db.tastingMenus.push(setMenu)
      saveMockDb(db)
      return ok(setMenu, 201)
    },
  },
  {
    id: 44,
    method: 'PUT',
    pattern: '/manager/tasting-menus/:id',
    access: ['Manager'],
    handler: ({ db, params, body }) => {
      const setMenu = db.tastingMenus.find((s) => s.id === params.id)
      if (!setMenu) return fail(404, 'Không tìm thấy Set Menu')
      const input = body as UpdateTastingMenuRequest
      setMenu.name = input.name.trim()
      setMenu.description = input.description?.trim() || null
      setMenu.price = Math.round(input.price)
      if (input.imageUrl !== undefined) setMenu.imageUrl = input.imageUrl
      if (input.isActive !== undefined) setMenu.isActive = input.isActive
      setMenu.items = input.items.map((row) => {
        const dish = db.menuItems.find((m) => m.id === row.menuItemId)
        return {
          id: nextMockId('smi'),
          tastingMenuId: setMenu.id,
          menuItemId: row.menuItemId,
          menuItemName: dish?.name ?? 'Món ăn',
          courseOrder: row.courseOrder,
          courseType: row.courseType,
          prepTimeMinutes: dish?.prepTimeMinutes ?? 15,
        }
      })
      saveMockDb(db)
      return ok(setMenu)
    },
  },
  {
    id: 45,
    method: 'DELETE',
    pattern: '/manager/tasting-menus/:id',
    access: ['Manager'],
    handler: ({ db, params }) => {
      const idx = db.tastingMenus.findIndex((s) => s.id === params.id)
      if (idx === -1) return fail(404, 'Không tìm thấy Set Menu')
      db.tastingMenus.splice(idx, 1)
      saveMockDb(db)
      return ok({ deleted: true })
    },
  },
]
