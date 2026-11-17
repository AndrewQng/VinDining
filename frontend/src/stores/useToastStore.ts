import { create } from 'zustand'

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface ToastItem {
  id: string
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastState {
  toasts: ToastItem[]
  push: (item: Omit<ToastItem, 'id'>) => string
  dismiss: (id: string) => void
  clear: () => void
}

let toastSeq = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (item) => {
    toastSeq += 1
    const id = `toast-${Date.now()}-${toastSeq}`
    set((state) => ({ toasts: [...state.toasts, { ...item, id }] }))
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }))
      }, 4000)
    }
    return id
  },
  dismiss: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
  clear: () => set({ toasts: [] }),
}))

export const toast = {
  info: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, variant: 'info' }),
  success: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, variant: 'success' }),
  warning: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, variant: 'warning' }),
  error: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, variant: 'error' }),
}
