import { useState } from 'react'
import { AuthContext } from './authContext'
import * as authApi from '../api/auth'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authApi.getStoredUser())

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