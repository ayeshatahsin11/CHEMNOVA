import { AnimatePresence, motion } from 'framer-motion'

export const scenes = [
  {
    id: 'organic',
    name: 'Organic',
    caption: 'From benzene rings to reaction mechanisms, learn organic chemistry the way it clicks.',
    background:
      'radial-gradient(900px 520px at 15% 20%, rgba(34,211,238,0.32), transparent 60%), radial-gradient(800px 500px at 90% 85%, rgba(16,185,129,0.22), transparent 60%), #04121c',
  },
  {
    id: 'reactions',
    name: 'Reactions',
    caption: 'Every question is a reaction. Mix concepts, test ideas and watch understanding bubble up.',
    background:
      'radial-gradient(900px 520px at 85% 15%, rgba(139,92,246,0.38), transparent 60%), radial-gradient(800px 500px at 10% 90%, rgba(244,114,182,0.25), transparent 60%), #0e0820',
  },
  {
    id: 'atomic',
    name: 'Atomic',
    caption: 'Go deeper than the textbook, from electron shells to your own research ideas.',
    background:
      'radial-gradient(900px 520px at 80% 30%, rgba(59,130,246,0.35), transparent 60%), radial-gradient(700px 450px at 15% 85%, rgba(251,191,36,0.18), transparent 60%), #060b1e',
  },
]

/* ---------- Scene 1: floating benzene rings ---------- */
function Benzene({ size, color = '#22d3ee', className = '', style }) {
  const r = 40
  const c = 50
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2
    return [c + r * Math.cos(a), c + r * Math.sin(a)]
  })
  const shrink = ([x, y]) => [c + (x - c) * 0.78, c + (y - c) * 0.78]

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={style}
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points={pts.map((p) => p.join(',')).join(' ')} />
      {[0, 2, 4].map((i) => {
        const [x1, y1] = shrink(pts[i])
        const [x2, y2] = shrink(pts[(i + 1) % 6])
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
      })}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.4" fill={color} stroke="none" />
      ))}
    </svg>
  )
}

const rings = [
  { size: 220, top: '8%', left: '6%', anim: 'animate-float', opacity: 0.35 },
  { size: 140, top: '58%', left: '14%', anim: 'animate-float-slow', opacity: 0.25 },
  { size: 300, top: '12%', right: '4%', anim: 'animate-spin-slow', opacity: 0.28 },
  { size: 110, top: '72%', right: '22%', anim: 'animate-float', opacity: 0.3 },
  { size: 80, top: '36%', left: '44%', anim: 'animate-float-slow', opacity: 0.18 },
]

function OrganicScene() {
  return (
    <>
      {rings.map((r, i) => (
        <Benzene
          key={i}
          size={r.size}
          className={`absolute ${r.anim}`}
          style={{ top: r.top, left: r.left, right: r.right, opacity: r.opacity }}
        />
      ))}
    </>
  )
}

/* ---------- Scene 2: rising bubbles ---------- */
const bubbles = Array.from({ length: 22 }, (_, i) => ({
  left: `${(i * 47) % 100}%`,
  size: 10 + ((i * 13) % 34),
  delay: `${-((i * 1.7) % 12)}s`,
  duration: `${9 + (i % 6) * 2}s`,
  color: i % 2 === 0 ? 'rgba(196,181,253,0.55)' : 'rgba(244,114,182,0.5)',
}))

function ReactionScene() {
  return (
    <>
      {bubbles.map((b, i) => (
        <span
          key={i}
          className="animate-rise absolute rounded-full"
          style={{
            left: b.left,
            bottom: '-60px',
            width: b.size,
            height: b.size,
            border: `1px solid ${b.color}`,
            background: `radial-gradient(circle at 30% 30%, ${b.color}, transparent 70%)`,
            animationDuration: b.duration,
            animationDelay: b.delay,
          }}
        />
      ))}
    </>
  )
}

/* ---------- Scene 3: atom with orbiting electrons ---------- */
function AtomicScene() {
  return (
    <svg
      viewBox="-200 -200 400 400"
      className="absolute top-1/2 right-[-25%] h-[110%] -translate-y-1/2 opacity-70 md:right-[2%]"
      fill="none"
    >
      <circle r="34" fill="#fbbf24" opacity="0.12" />
      <circle r="18" fill="#fbbf24" opacity="0.25" />
      <circle r="9" fill="#fbbf24" />
      {[0, 60, 120].map((deg, i) => (
        <g key={deg} transform={`rotate(${deg})`}>
          <ellipse rx="160" ry="62" stroke="rgba(147,197,253,0.45)" strokeWidth="1.2" />
          <circle r="6" fill="#93c5fd">
            <animateMotion
              dur={`${6 + i * 2}s`}
              repeatCount="indefinite"
              path="M -160 0 A 160 62 0 1 1 160 0 A 160 62 0 1 1 -160 0"
            />
          </circle>
        </g>
      ))}
    </svg>
  )
}

/* ---------- Floating formula chips (all scenes) ---------- */
const chips = [
  { t: 'H₂O', top: '16%', left: '50%' },
  { t: 'C₆H₆', top: '70%', left: '38%' },
  { t: 'NaCl', top: '30%', left: '78%' },
  { t: 'CH₄', top: '80%', left: '66%' },
  { t: 'pH 7', top: '12%', left: '26%' },
]

export default function HeroBackground({ index }) {
  const scene = scenes[index]

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence>
        <motion.div
          key={scene.id}
          className="absolute inset-0"
          style={{ background: scene.background }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
        >
          {scene.id === 'organic' && <OrganicScene />}
          {scene.id === 'reactions' && <ReactionScene />}
          {scene.id === 'atomic' && <AtomicScene />}
        </motion.div>
      </AnimatePresence>

      <div className="bg-grid absolute inset-0" />

      {chips.map((c) => (
        <span
          key={c.t}
          className="animate-float-slow absolute hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-white/60 backdrop-blur-sm md:block"
          style={{ top: c.top, left: c.left }}
        >
          {c.t}
        </span>
      ))}

      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-bg" />
    </div>
  )
}