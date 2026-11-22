import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merges class names while resolving Tailwind utility conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Returns true when built as the dedicated Staff-only mobile/tablet app (no guest website routes). */
export function isStaffAppMode(): boolean {
  return import.meta.env.VITE_APP_MODE === 'staff'
}
