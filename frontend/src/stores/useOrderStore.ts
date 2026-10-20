import { create } from 'zustand'
import type { MenuItem } from '@/types/menu'

export interface CartItem {
  menuItem: MenuItem
  quantity: number
  specialInstructions?: string
}

interface OrderStoreState {
  selectedTableId: string | null
  cart: CartItem[]
  setSelectedTableId: (tableId: string | null) => void
  addToCart: (item: MenuItem, quantity?: number, instructions?: string) => void
  removeFromCart: (menuItemId: string) => void
  updateQuantity: (menuItemId: string, quantity: number) => void
  updateInstructions: (menuItemId: string, instructions: string) => void
  clearCart: () => void
}

export const useOrderStore = create<OrderStoreState>((set) => ({
  selectedTableId: null,
  cart: [],

  setSelectedTableId: (tableId) => set({ selectedTableId: tableId }),

  addToCart: (item, quantity = 1, instructions) =>
    set((state) => {
      const existingIndex = state.cart.findIndex((c) => c.menuItem.id === item.id)
      if (existingIndex > -1) {
        const nextCart = [...state.cart]
        nextCart[existingIndex].quantity += quantity
        if (instructions) {
          nextCart[existingIndex].specialInstructions = instructions
        }
        return { cart: nextCart }
      }
      return {
        cart: [...state.cart, { menuItem: item, quantity, specialInstructions: instructions }],
      }
    }),

  removeFromCart: (menuItemId) =>
    set((state) => ({
      cart: state.cart.filter((c) => c.menuItem.id !== menuItemId),
    })),

  updateQuantity: (menuItemId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return { cart: state.cart.filter((c) => c.menuItem.id !== menuItemId) }
      }
      return {
        cart: state.cart.map((c) =>
          c.menuItem.id === menuItemId ? { ...c, quantity } : c
        ),
      }
    }),

  updateInstructions: (menuItemId, instructions) =>
    set((state) => ({
      cart: state.cart.map((c) =>
        c.menuItem.id === menuItemId ? { ...c, specialInstructions: instructions } : c
      ),
    })),

  clearCart: () => set({ cart: [] }),
}))
