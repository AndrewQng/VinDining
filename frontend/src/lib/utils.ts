import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merges class names while resolving Tailwind utility conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Returns true when the frontend is configured to run against the in-browser mock API. */
export function isMockMode(): boolean {
  return import.meta.env.VITE_USE_MOCK === 'true'
}
