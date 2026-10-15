import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GuestLayout } from '@/layouts/GuestLayout'
import { StaffLayout } from '@/layouts/StaffLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { ReservationPage } from '@/pages/guest/ReservationPage'
import { EMenuPage } from '@/pages/guest/EMenuPage'
import { FloorPlanPage } from '@/pages/staff/FloorPlanPage'
import { ExpediterPage } from '@/pages/staff/ExpediterPage'
import { ManagerPage } from '@/pages/staff/ManagerPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Guest Area (Public) */}
        <Route element={<GuestLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/reserve" element={<ReservationPage />} />
          <Route path="/menu" element={<EMenuPage />} />
        </Route>

        {/* Staff Authentication */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Staff Area (RBAC) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<StaffLayout />}>
            {/* Common Staff Route: Floor Plan */}
            <Route path="/pos/tables" element={<FloorPlanPage />} />
            <Route path="/pos" element={<Navigate to="/pos/tables" replace />} />

            {/* Expediter & Kitchen Pass */}
            <Route element={<ProtectedRoute allowedRoles={['Expediter', 'Manager', 'Admin']} />}>
              <Route path="/expediter" element={<ExpediterPage />} />
            </Route>

            {/* Manager & Admin */}
            <Route element={<ProtectedRoute allowedRoles={['Manager', 'Admin']} />}>
              <Route path="/manager" element={<ManagerPage />} />
            </Route>
          </Route>
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
