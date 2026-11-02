import { Link } from 'react-router'
import { useAuth } from '../auth/AuthContext.jsx'

export default function NotFoundPage() {
  const { user } = useAuth()
  const homePath = user ? (user.role === 'ADMIN' ? '/admin/timetables' : '/my-week') : '/login'

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-6">The page you are looking for does not exist.</p>
        <Link
          to={homePath}
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  )
}
