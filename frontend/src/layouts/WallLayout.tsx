import { Outlet } from 'react-router-dom'

/** Chrome-free full-viewport layout for the wall-mounted KDS Bếp display. */
export function WallLayout() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <Outlet />
    </div>
  )
}
