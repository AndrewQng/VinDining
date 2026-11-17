/** Canonical course categories (Beverage fires alongside Appetizer in Course 1). */
export type CourseType = 'Appetizer' | 'MainCourse' | 'Dessert' | 'Beverage'

/** Canonical menu item availability status. */
export type MenuItemStatus = 'Available' | 'SoldOut'

/** Menu category DTO matching the Categories ERD table. */
export interface CategoryDto {
  id: string
  name: string
  description: string | null
  courseType: CourseType
  isActive: boolean
}

/** A la carte menu item DTO matching the MenuItems ERD table. */
export interface MenuItemDto {
  id: string
  categoryId: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  status: MenuItemStatus
  prepTimeMinutes: number
  courseType: CourseType
  createdAt: string
}

/** Payload for POST /api/manager/menu-items. */
export interface CreateMenuItemRequest {
  categoryId: string
  name: string
  description?: string | null
  price: number
  imageUrl?: string | null
  prepTimeMinutes: number
  courseType: CourseType
  status?: MenuItemStatus
}

/** Payload for PUT /api/manager/menu-items/{id}. */
export interface UpdateMenuItemRequest {
  categoryId?: string
  name: string
  description?: string | null
  price: number
  imageUrl?: string | null
  prepTimeMinutes: number
  courseType: CourseType
}

/** Payload for PATCH /api/manager/menu-items/{id}/availability. */
export interface ToggleAvailabilityRequest {
  status: MenuItemStatus
}

/** Component dish within a TastingMenu (Set Menu). */
export interface TastingMenuItemDto {
  id: string
  tastingMenuId: string
  menuItemId: string
  menuItemName: string
  courseOrder: number
  courseType: CourseType
  prepTimeMinutes: number
}

/** Set Menu / TastingMenu DTO matching the TastingMenus ERD table. */
export interface TastingMenuDto {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  isActive: boolean
  items: TastingMenuItemDto[]
  createdAt: string
}

/** Component item input when creating or updating a TastingMenu. */
export interface TastingMenuItemInput {
  menuItemId: string
  courseOrder: number
  courseType: CourseType
}

/** Payload for POST /api/manager/tasting-menus. */
export interface CreateTastingMenuRequest {
  name: string
  description?: string | null
  price: number
  imageUrl?: string | null
  isActive?: boolean
  items: TastingMenuItemInput[]
}

/** Payload for PUT /api/manager/tasting-menus/{id}. */
export interface UpdateTastingMenuRequest {
  name: string
  description?: string | null
  price: number
  imageUrl?: string | null
  isActive?: boolean
  items: TastingMenuItemInput[]
}

/** Response returned by GET /api/menu/table/{id} for the view-only QR E-Menu. */
export interface TableMenuResponse {
  tableId: string
  tableNumber: string
  isCheckedIn: boolean
  tastingMenus: TastingMenuDto[]
  categories: CategoryDto[]
  items: MenuItemDto[]
}
