import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Mic, ClipboardCheck, FlaskConical, Bot, Gamepad2, TrendingUp, ArrowRight, Sparkles,
} from 'lucide-react'
import LandingNavbar from '../components/layout/LandingNavbar'
import HeroBackground, { scenes } from '../components/hero/HeroBackground'
import SpotlightCard from '../components/ui/SpotlightCard'

const stats = [
  ['8', 'Core modules'],
  ['6', 'Viva modes'],
  ['6', 'Question types'],
]

const features = [
  {
    icon: Mic,
    title: 'AI Viva Examiner',
    desc: 'A real examiner that asks one question at a time, follows up on your answers and scores your reasoning.',
    tags: ['Text or voice', '6 exam modes', 'Detailed report'],
    gradient: 'from-cyan-400 to-blue-500',
  },
  {
    icon: ClipboardCheck,
    title: 'Assessment Studio',
    desc: 'Generate timed tests in six question formats, with auto-grading and full explanations.',
    tags: ['MCQ to numericals', 'Timed exams', 'Performance analytics'],
    gradient: 'from-violet-400 to-fuchsia-500',
  },
  {
    icon: FlaskConical,
    title: 'Research Studio',
    desc: 'Find real papers, chat with your PDFs and keep a research notebook in one workspace.',
    tags: ['Real paper search', 'PDF Q&A with pages', 'Proposal helper'],
    gradient: 'from-emerald-400 to-cyan-500',
  },
  {
    icon: Bot,
    title: 'Chemistry AI Companion',
    desc: 'Ask anything, from nomenclature to reaction mechanisms, explained at your level.',
    tags: ['Explain like I am 15', 'Step-by-step solver', 'Exam prep mode'],
    gradient: 'from-sky-400 to-indigo-500',
  },
  {
    icon: Gamepad2,
    title: 'Fun Zone',
    desc: 'Quick chemistry games and daily challenges that make revision feel like play.',
    tags: ['Element match', 'Mystery compound', 'Daily streaks'],
    gradient: 'from-amber-400 to-pink-500',
  },
  {
    icon: TrendingUp,
    title: 'Learning Analytics',
    desc: 'See your strong and weak topics, track progress and get smart next-step suggestions.',
    tags: ['Subject-wise charts', 'Weak-topic finder', 'Recommendations'],
    gradient: 'from-pink-400 to-violet-500',
  },
]

export default function Landing() {
  const [scene, setScene] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setScene((s) => (s + 1) % scenes.length), 7000)
    return () => clearInterval(id)
  }, [scene])

  return (
    <div className="bg-bg text-content">
      <LandingNavbar />

      {/* ---------- HERO ---------- */}
      <section className="relative flex min-h-screen items-center overflow-hidden">
        <HeroBackground index={scene} />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-28 pb-24">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-cyan-200 backdrop-blur"
          >
            <Sparkles size={14} /> AI-powered chemistry platform for school and university
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 max-w-3xl text-5xl leading-[1.05] font-bold tracking-tight text-white md:text-7xl"
          >
            Beyond Learning.
            <br />
            <span className="text-gradient">Into Discovery.</span>
          </motion.h1>

          <div className="mt-6 min-h-[4.5rem] max-w-xl">
            <AnimatePresence mode="wait">
              <motion.p
                key={scene}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="text-lg text-white/70"
              >
                {scenes[scene].caption}
              </motion.p>
            </AnimatePresence>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            <Link to="/register" className="btn-glow">
              Get started free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-ghost">
              Explore as guest
            </Link>
          </motion.div>

          <div className="mt-14 flex flex-wrap items-center justify-between gap-6">
            <div className="flex gap-10">
              {stats.map(([n, label]) => (
                <div key={label}>
                  <p className="text-3xl font-bold text-white">{n}</p>
                  <p className="text-xs tracking-wide text-white/50 uppercase">{label}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {scenes.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setScene(i)}
                  aria-label={`Show ${s.name} scene`}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                    i === scene
                      ? 'border-white/40 bg-white/15 text-white'
                      : 'border-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${i === scene ? 'bg-cyan-300' : 'bg-white/40'}`} />
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <p className="font-mono text-sm text-accent">// the toolkit</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Everything a chemist needs, in one lab.
          </h2>
          <p className="mt-3 text-muted">
            Practice, get examined, research and play, all personalised to your level.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="h-full"
            >
              <SpotlightCard className="h-full p-6">
                <span className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${f.gradient}`}>
                  <f.icon size={22} className="text-[#04121c]" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>

                {/* revealed on hover */}
                <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-500 group-hover:mt-4 group-hover:grid-rows-[1fr] group-hover:opacity-100">
                  <div className="overflow-hidden">
                    <div className="flex flex-wrap gap-2">
                      {f.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-accent"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="mt-5 flex items-center gap-1 text-sm font-medium text-accent">
                  Explore
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1.5" />
                </p>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted">
        © {new Date().getFullYear()} ChemNova · Beyond Learning. Into Discovery.
      </footer>
    </div>
  )
}