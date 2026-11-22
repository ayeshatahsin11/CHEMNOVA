import { useEffect, useState } from 'react'
import { AuthContext } from './authContext'
import * as authApi from '../api/auth'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authApi.getStoredUser())

  // The API client fires this when the server rejects our token
  useEffect(() => {
    const onUnauthorized = () => {
      authApi.clearSession()
      setUser(null)
    }
    window.addEventListener('chemnova:unauthorized', onUnauthorized)
    return () => window.removeEventListener('chemnova:unauthorized', onUnauthorized)
  }, [])

  // Re-check a saved session with the server once when the app loads
  useEffect(() => {
    if (!authApi.getToken()) return
    let cancelled = false
    authApi
      .meRequest()
      .then((fresh) => {
        if (!cancelled) setUser(fresh)
      })
      .catch(() => {}) // offline or server asleep: keep the saved session
    return () => {
      cancelled = true
    }
  }, [])

  const register = async (data) => setUser(await authApi.registerRequest(data))
  const login = async (data) => setUser(await authApi.loginRequest(data))
  const guestLogin = async () => setUser(await authApi.guestRequest())

  const logout = () => {
    authApi.clearSession()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, register, login, guestLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}