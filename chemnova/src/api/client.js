import axios from 'axios'

export const TOKEN_KEY = 'chemnova-token'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // free hosting can take a while to wake up
})

// Attach the saved token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const authAttempts = ['/auth/login', '/auth/register', '/auth/guest']

// If the server rejects our token (expired, tampered, or the account is gone),
// tell the app so it can sign the user out. Failed login attempts are not included.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || ''
    if (error.response?.status === 401 && !authAttempts.includes(url)) {
      window.dispatchEvent(new Event('chemnova:unauthorized'))
    }
    return Promise.reject(error)
  },
)

// Turns any axios error into a message that is safe to show the user
export function getErrorMessage(error) {
  if (error.code === 'ECONNABORTED') {
    return 'The server took too long to respond. Please try again.'
  }
  if (!error.response) {
    return 'Cannot reach the server. Make sure the backend is running.'
  }
  return error.response.data?.message || 'Something went wrong. Please try again.'
}

export default api