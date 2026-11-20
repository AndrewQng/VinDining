import { Outlet } from 'react-router-dom'
import { useThemeArea } from '@/stores/useThemeStore'

/** Chrome-free full-viewport layout for the wall-mounted KDS Bếp display. */
export function WallLayout() {
  useThemeArea('staff')
  return (
    <div className="min-h-screen bg-bg text-ink">
      <Outlet />
    </div>
  )
}
