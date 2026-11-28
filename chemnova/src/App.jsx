import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import ThemeProvider from './context/ThemeProvider'
import AuthProvider from './context/AuthProvider'
import ProtectedRoute from './routes/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Viva from './pages/Viva'
import VivaSession from './pages/VivaSession'
import Assessments from './pages/Assessments'
import AssessmentDetail from './pages/AssessmentDetail'
import AssessmentAttempt from './pages/AssessmentAttempt'
import AppLayout from './components/layout/AppLayout'
import AmbientBackground from './components/ui/AmbientBackground'
import ModulePlaceholder from './components/ui/ModulePlaceholder'
import { navItems } from './lib/navigation'
import Companion from './pages/Companion'
import FunZone from './pages/FunZone'
import GameIntro from './pages/GameIntro'
import GameRound from './pages/GameRound'

// Modules that already have a real page
const built = ['/dashboard', '/viva', '/assessments', '/companion', '/fun-zone']

function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 text-content">
      <AmbientBackground />
      <div className="relative z-10 flex flex-col items-center gap-4 text-center">
        <p className="text-gradient font-mono text-6xl font-bold">404</p>
        <h1 className="text-2xl font-bold">This compound does not exist</h1>
        <p className="text-muted">The page you are looking for could not be found.</p>
        <Link to="/" className="btn-glow mt-2">
          Back to home
        </Link>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/viva" element={<Viva />} />
                <Route path="/viva/:id" element={<VivaSession />} />
                <Route path="/assessments" element={<Assessments />} />
                <Route path="/assessments/:id" element={<AssessmentDetail />} />
                <Route path="/assessments/attempt/:id" element={<AssessmentAttempt />} />
                                <Route path="/companion/:id?" element={<Companion />} />
                                                <Route path="/fun-zone" element={<FunZone />} />
                <Route path="/fun-zone/play/:game" element={<GameIntro />} />
                <Route path="/fun-zone/round/:id" element={<GameRound />} />
                {navItems
                  .filter((item) => !built.includes(item.to))
                  .map((item) => (
                    <Route key={item.to} path={item.to} element={<ModulePlaceholder item={item} />} />
                  ))}
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}