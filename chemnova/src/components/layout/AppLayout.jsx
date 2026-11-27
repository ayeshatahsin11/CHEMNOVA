import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import AmbientBackground from '../ui/AmbientBackground'
import SidebarContent from './SidebarContent'
import Topbar from './Topbar'

export default function AppLayout() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="relative min-h-screen text-content">
      <AmbientBackground />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-surface/50 backdrop-blur-xl lg:block">
        <SidebarContent layoutKey="desktop" />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <div key="drawer" className="fixed inset-0 z-40 lg:hidden">
            <motion.button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 w-72 border-r border-border bg-surface/95 backdrop-blur-xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.28 }}
            >
              <SidebarContent
                layoutKey="mobile"
                onNavigate={() => setOpen(false)}
                onClose={() => setOpen(false)}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="relative z-10 lg:pl-64">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="px-4 py-8 sm:px-8">
          <motion.div
                        key={location.pathname.startsWith('/companion') ? '/companion' : location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}