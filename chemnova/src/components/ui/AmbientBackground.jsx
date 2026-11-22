import { Benzene } from '../hero/HeroBackground'

export default function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-bg">
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="orb orb-c" />
      <div className="bg-grid absolute inset-0 opacity-70" />

      <Benzene
        size={280}
        className="animate-spin-slow absolute top-[28%] -left-20 opacity-[0.08]"
      />
      <Benzene
        size={190}
        color="#8b5cf6"
        className="animate-float-slow absolute top-[62%] right-[5%] opacity-[0.1]"
      />
    </div>
  )
}