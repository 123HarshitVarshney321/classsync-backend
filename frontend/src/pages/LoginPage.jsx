import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router'
import { useAuth } from '../auth/AuthContext.jsx'
import Alert from '../components/Alert.jsx'
import Loading from '../components/Loading.jsx'

export default function LoginPage() {
  const { user, login, sessionExpiredMessage, clearSessionExpiredMessage, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading message="Checking session..." />
      </div>
    )
  }

  if (user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/timetables' : '/my-week'} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    clearSessionExpiredMessage()

    if (!email || !password) {
      setError('Please provide both email and password.')
      return
    }

    setSubmitting(true)
    try {
      const loggedUser = await login(email.trim(), password)
      if (loggedUser.role === 'ADMIN') {
        navigate('/admin/timetables', { replace: true })
      } else {
        navigate('/my-week', { replace: true })
      }
    } catch (err) {
      if (err.status === 401) {
        setError('Invalid email or password')
      } else {
        setError(err.message || 'Failed to sign in. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail)
    setPassword('password123')
    setError('')
    clearSessionExpiredMessage()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 border border-gray-200">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">ClassSync</h1>
          <p className="text-sm text-gray-600 mt-1">Classroom Scheduling & Timetable System</p>
        </div>

        {sessionExpiredMessage && (
          <Alert
            type="error"
            message={sessionExpiredMessage}
            onClose={clearSessionExpiredMessage}
            className="mb-4"
          />
        )}

        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
            className="mb-4"
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. aturing@classsync.edu"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Demo Accounts (password: password123)
          </p>
          <div className="space-y-1 text-xs text-gray-500">
            <div
              onClick={() => fillDemo('admin@classsync.edu')}
              className="cursor-pointer hover:text-blue-600 transition-colors p-1 rounded hover:bg-gray-50 flex justify-between"
            >
              <span>admin@classsync.edu</span>
              <span className="font-medium text-gray-400">ADMIN</span>
            </div>
            <div
              onClick={() => fillDemo('aturing@classsync.edu')}
              className="cursor-pointer hover:text-blue-600 transition-colors p-1 rounded hover:bg-gray-50 flex justify-between"
            >
              <span>aturing@classsync.edu</span>
              <span className="font-medium text-gray-400">PROFESSOR</span>
            </div>
            <div
              onClick={() => fillDemo('alovelace@classsync.edu')}
              className="cursor-pointer hover:text-blue-600 transition-colors p-1 rounded hover:bg-gray-50 flex justify-between"
            >
              <span>alovelace@classsync.edu</span>
              <span className="font-medium text-gray-400">PROFESSOR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
