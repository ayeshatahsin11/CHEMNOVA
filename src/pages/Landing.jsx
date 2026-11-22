import { useEffect, useState } from 'react'
import LandingActions from '../components/landing/LandingActions'
import useAuth from '../hooks/useAuth'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Mic, ClipboardCheck, FlaskConical, Bot, Gamepad2, TrendingUp,
  ArrowRight, Sparkles, Check, Target, Zap,
} from 'lucide-react'
import LandingNavbar from '../components/layout/LandingNavbar'
import HeroBackground, { scenes } from '../components/hero/HeroBackground'
import AmbientBackground from '../components/ui/AmbientBackground'
import SpotlightCard from '../components/ui/SpotlightCard'
import SectionHeading from '../components/ui/SectionHeading'
import Marquee from '../components/landing/Marquee'
import VivaPreview from '../components/landing/VivaPreview'

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

const steps = [
  {
    n: '01',
    icon: Target,
    title: 'Set your level',
    desc: 'Choose school or university and pick the subjects you care about.',
  },
  {
    n: '02',
    icon: Zap,
    title: 'Practise your way',
    desc: 'Sit a viva, build a timed test, chat with the companion or play a quick game.',
  },
  {
    n: '03',
    icon: TrendingUp,
    title: 'Track and improve',
    desc: 'Spot weak topics, review your history and follow the suggested next steps.',
  },
]

const vivaPoints = [
  'Asks one question at a time, like a real examiner',
  'Follows up on the gaps in your answers',
  'Scores accuracy, understanding and reasoning',
]

export default function Landing() {
  const [scene, setScene] = useState(0)
    const { user } = useAuth()
  const realUser = user && !user.isGuest

  useEffect(() => {
    const id = setInterval(() => setScene((s) => (s + 1) % scenes.length), 7000)
    return () => clearInterval(id)
  }, [scene])

  return (
    <div className="relative text-content">
      <AmbientBackground />

      <div className="relative z-10">
        <LandingNavbar />

              {/* ---------- HERO ---------- */}
        <section className="relative flex min-h-screen items-center overflow-hidden">
          <HeroBackground index={scene} />

          <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-28 pb-24">
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-xs font-medium text-accent backdrop-blur"
            >
              <Sparkles size={14} /> AI-powered chemistry platform for school and university
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mt-6 max-w-3xl text-5xl leading-[1.05] font-bold tracking-tight text-content md:text-7xl"
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
                  className="text-lg text-content/75"
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
                         <LandingActions variant="hero" />
            </motion.div>

            <div className="mt-14 flex flex-wrap items-center justify-between gap-6">
              <div className="flex gap-10">
                {stats.map(([n, label]) => (
                  <div key={label}>
                    <p className="text-3xl font-bold text-content">{n}</p>
                    <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
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
                        ? 'border-accent/60 bg-accent/15 text-content'
                        : 'border-border text-muted hover:text-content'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${i === scene ? 'bg-accent' : 'bg-muted'}`} />
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Marquee />

        {/* ---------- FEATURES ---------- */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-24">
          <SectionHeading
            eyebrow="// the toolkit"
            title="Everything a chemist needs, in one lab."
            subtitle="Practice, get examined, research and play, all personalised to your level."
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.1 }}
                className="h-full"
              >
                <SpotlightCard className="h-full p-6">
                  <div className="relative h-12 w-12">
                    <span
                      className={`absolute inset-0 rounded-xl bg-gradient-to-br ${f.gradient} opacity-40 blur-xl transition-opacity duration-500 group-hover:opacity-90`}
                    />
                    <span
                      className={`relative grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${f.gradient}`}
                    >
                      <f.icon size={22} className="text-[#04121c]" />
                    </span>
                  </div>

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

        {/* ---------- VIVA SHOWCASE ---------- */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.5fr]">
            <div>
              <SectionHeading
                eyebrow="// flagship feature"
                title="Face an examiner that actually listens."
                subtitle="Your answer shapes the next question, so every session adapts to what you know and what you miss."
              />
              <ul className="mt-8 space-y-4">
                {vivaPoints.map((p, i) => (
                  <motion.li
                    key={p}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.12 }}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500">
                      <Check size={14} className="text-[#04121c]" />
                    </span>
                    <span className="text-sm text-muted">{p}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            <VivaPreview />
          </div>
        </section>

        {/* ---------- HOW IT WORKS ---------- */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <SectionHeading
            center
            eyebrow="// how it works"
            title="From first question to real progress."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="h-full"
              >
                <SpotlightCard className="h-full p-6">
                  <div className="flex items-start justify-between">
                    <span className="text-gradient font-mono text-5xl font-bold">{s.n}</span>
                    <span className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-surface-2 text-accent transition-transform duration-500 group-hover:rotate-12">
                      <s.icon size={18} />
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ---------- CTA ---------- */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="shimmer-border rounded-3xl p-px"
          >
            <div className="relative overflow-hidden rounded-3xl bg-bg px-8 py-16 text-center">
              <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-400/30 via-violet-500/30 to-pink-500/30 blur-3xl" />
              <h2 className="relative text-3xl font-bold tracking-tight md:text-5xl">
                Ready to run your first
                <br />
                <span className="text-gradient">experiment in learning?</span>
              </h2>
                          <p className="relative mx-auto mt-4 max-w-xl text-muted">
                {realUser
                  ? `Welcome back, ${user.name.split(' ')[0]}. Pick up where you left off.`
                  : user?.isGuest
                    ? 'You are exploring as a guest. Create a free account to save your progress.'
                    : 'Create a free account, or jump in as a guest and try the viva, the quizzes and the Fun Zone.'}
              </p>
              <div className="relative mt-8 flex flex-wrap justify-center gap-4 text-center">
                <LandingActions variant="cta" />
              </div>
            </div>
          </motion.div>
        </section>

        {/* ---------- FOOTER ---------- */}
        <footer className="border-t border-border bg-surface/40 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted sm:flex-row">
            <p className="flex items-center gap-2 font-semibold text-content">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-cyan-400 to-violet-500">
                <FlaskConical size={14} className="text-[#04121c]" />
              </span>
              ChemNova
            </p>
            <p>Beyond Learning. Into Discovery.</p>
            <p>© {new Date().getFullYear()} ChemNova</p>
          </div>
        </footer>
      </div>
    </div>
  )
}