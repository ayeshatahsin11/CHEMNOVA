import { useEffect, useState } from 'react'
import { ThemeContext } from './themeContext'

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('chemnova-theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('chemnova-theme', theme)
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}