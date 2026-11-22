import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import ThemeProvider from './context/ThemeProvider'
import Landing from './pages/Landing'
import AppLayout from './components/layout/AppLayout'
import AmbientBackground from './components/ui/AmbientBackground'
import ModulePlaceholder from './components/ui/ModulePlaceholder'
import { navItems } from './lib/navigation'

function ComingSoon({ title, preview = false }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 text-content">
      <AmbientBackground />
      <div className="relative z-10 flex flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted">This page arrives in the next steps.</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-outline">Back to home</Link>
          {preview && (
            <Link to="/dashboard" className="btn-glow">Preview the app shell</Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<ComingSoon title="Login" preview />} />
          <Route path="/register" element={<ComingSoon title="Register" preview />} />

          <Route element={<AppLayout />}>
            {navItems.map((item) => (
              <Route key={item.to} path={item.to} element={<ModulePlaceholder item={item} />} />
            ))}
          </Route>

          <Route path="*" element={<ComingSoon title="Page not found" />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}