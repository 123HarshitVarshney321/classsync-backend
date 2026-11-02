import { Link } from 'react-router'
import { useAuth } from '../auth/AuthContext.jsx'

export default function NotAllowedPage() {
  const { user } = useAuth()
  const homePath = user?.role === 'ADMIN' ? '/admin/timetables' : '/my-week'

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">You don't have access to this page.</p>
        <Link
          to={homePath}
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  )
}
