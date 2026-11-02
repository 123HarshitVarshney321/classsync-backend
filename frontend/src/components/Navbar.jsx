import { Link, useNavigate, useLocation } from 'react-router'
import { useAuth } from '../auth/AuthContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!user) return null

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isProf = user.role === 'PROFESSOR'
  const isAdmin = user.role === 'ADMIN'

  const navLinkClass = (path) => {
    const isActive = location.pathname === path || location.pathname.startsWith(path + '/')
    return `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-700 text-white'
        : 'text-blue-100 hover:bg-blue-600 hover:text-white'
    }`
  }

  return (
    <nav className="bg-blue-600 shadow text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-6">
            <Link
              to={isProf ? '/my-week' : '/admin/timetables'}
              className="text-xl font-bold tracking-tight text-white flex items-center gap-2"
            >
              <span>ClassSync</span>
            </Link>

            <div className="flex items-center space-x-2">
              {isProf && (
                <>
                  <Link to="/my-week" className={navLinkClass('/my-week')}>
                    My Week
                  </Link>
                  <Link to="/find-room" className={navLinkClass('/find-room')}>
                    Find a Room
                  </Link>
                  <Link to="/occupancy" className={navLinkClass('/occupancy')}>
                    Occupancy
                  </Link>
                </>
              )}

              {isAdmin && (
                <>
                  <Link to="/admin/timetables" className={navLinkClass('/admin/timetables')}>
                    Timetables
                  </Link>
                  <Link to="/admin/generate" className={navLinkClass('/admin/generate')}>
                    Generate
                  </Link>
                  <Link to="/admin/campus" className={navLinkClass('/admin/campus')}>
                    Campus
                  </Link>
                  <Link to="/occupancy" className={navLinkClass('/occupancy')}>
                    Occupancy
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-semibold">{user.name}</div>
              <div className="text-xs text-blue-200 uppercase tracking-wider">{user.role}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-blue-700 hover:bg-blue-800 rounded text-white border border-blue-500 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
