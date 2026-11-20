import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { reservationApi } from '@/services/api'
import type { AvailableSlotDto, SlotTableDto, TableZone } from '@/types'

export const BOOKING_ZONES: readonly TableZone[] = ['MainHall', 'VIP', 'Balcony']

export const ZONE_PHOTOS: Record<TableZone, string> = {
  MainHall: 'zone_sanh_chinh.jpg',
  VIP: 'zone_vip.jpg',
  Balcony: 'zone_ban_cong.jpg',
}

/**
 * Availability of every table in every zone for one date and party size.
 * Steps 1 and 2 share this query, so switching zone or time never refetches,
 * and a new date keeps the previous numbers on screen until the new ones arrive.
 */
export function useBookingAvailability(date: string, partySize: number) {
  return useQuery({
    queryKey: ['booking-all-slots', date, partySize],
    queryFn: () => reservationApi.getAvailableSlots({ date, partySize }),
    placeholderData: keepPreviousData,
    staleTime: 0,
  })
}

export function getSlot(slots: AvailableSlotDto[], time: string) {
  return slots.find((s) => s.time === time) ?? null
}

export function getZoneTables(
  slots: AvailableSlotDto[],
  time: string,
  zone: TableZone
): SlotTableDto[] {
  return (getSlot(slots, time)?.zoneTables ?? []).filter((t) => t.zone === zone)
}

export function countFreeTables(
  slots: AvailableSlotDto[],
  time: string,
  zone?: TableZone
): number {
  const slot = getSlot(slots, time)
  if (!slot) return 0
  return slot.availableTables.filter((t) => !zone || t.zone === zone).length
}
