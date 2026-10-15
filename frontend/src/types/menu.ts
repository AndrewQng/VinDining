export type CourseType = 'Appetizer' | 'MainCourse' | 'Dessert' | 'Beverage'

export interface MenuItem {
  id: string
  name: string
  vietnameseName?: string
  description: string
  price: number
  categoryName: string
  courseType: CourseType
  imageUrl?: string
  allergens: string[]
  isAvailable: boolean
  preparationTimeMinutes: number
}

export interface TastingMenuItem {
  id: string
  courseNumber: number
  courseType: CourseType
  menuItemId: string
  menuItem: MenuItem
  chefNote?: string
}

export interface TastingMenu {
  id: string
  name: string
  description: string
  totalPrice: number
  courseCount: number
  items: TastingMenuItem[]
  isAvailable: boolean
}
