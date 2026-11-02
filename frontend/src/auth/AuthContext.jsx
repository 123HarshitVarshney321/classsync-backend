import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { apiLogin, apiGetMe, apiLogout } from '../api/endpoints.js'
import { setUnauthorizedHandler } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState('')

  const handleUnauthorized = useCallback(() => {
    setUser(null)
    setSessionExpiredMessage('Your session has expired. Please sign in again.')
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized)
    return () => setUnauthorizedHandler(null)
  }, [handleUnauthorized])

  useEffect(() => {
    let isMounted = true
    apiGetMe()
      .then((data) => {
        if (isMounted) {
          setUser(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null)
          setLoading(false)
        }
      })
    return () => {
      isMounted = false
    }
  }, [])

  const login = async (email, password) => {
    setSessionExpiredMessage('')
    const loggedUser = await apiLogin(email, password)
    setUser(loggedUser)
    return loggedUser
  }

  const logout = async () => {
    try {
      await apiLogout()
    } finally {
      setUser(null)
      setSessionExpiredMessage('')
    }
  }

  const clearSessionExpiredMessage = () => {
    setSessionExpiredMessage('')
  }

  const value = {
    user,
    loading,
    sessionExpiredMessage,
    login,
    logout,
    clearSessionExpiredMessage,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
