import { Routes, Route, Navigate } from 'react-router'
import { useAuth } from './auth/AuthContext.jsx'
import RequireRole from './auth/RequireRole.jsx'
import Navbar from './components/Navbar.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotAllowedPage from './pages/NotAllowedPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

import MyWeekPage from './pages/professor/MyWeekPage.jsx'
import FindRoomPage from './pages/professor/FindRoomPage.jsx'
import OccupancyPage from './pages/shared/OccupancyPage.jsx'
import CampusPage from './pages/admin/CampusPage.jsx'
import TimetablesPage from './pages/admin/TimetablesPage.jsx'
import VersionDetailPage from './pages/admin/VersionDetailPage.jsx'
import GeneratePage from './pages/admin/GeneratePage.jsx'

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'ADMIN' ? '/admin/timetables' : '/my-week'} replace />
}

export default function App() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {user && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomeRedirect />} />

          {/* Professor Routes */}
          <Route
            path="/my-week"
            element={
              <RequireRole allowedRoles={['PROFESSOR']}>
                <MyWeekPage />
              </RequireRole>
            }
          />
          <Route
            path="/find-room"
            element={
              <RequireRole allowedRoles={['PROFESSOR']}>
                <FindRoomPage />
              </RequireRole>
            }
          />

          {/* Shared Routes (Both PROFESSOR & ADMIN) */}
          <Route
            path="/occupancy"
            element={
              <RequireRole allowedRoles={['PROFESSOR', 'ADMIN']}>
                <OccupancyPage />
              </RequireRole>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/campus"
            element={
              <RequireRole allowedRoles={['ADMIN']}>
                <CampusPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/timetables"
            element={
              <RequireRole allowedRoles={['ADMIN']}>
                <TimetablesPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/timetables/:versionId"
            element={
              <RequireRole allowedRoles={['ADMIN']}>
                <VersionDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/generate"
            element={
              <RequireRole allowedRoles={['ADMIN']}>
                <GeneratePage />
              </RequireRole>
            }
          />

          <Route path="/not-allowed" element={<NotAllowedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  )
}
