import { motion } from 'framer-motion'

export default function SectionHeading({ eyebrow, title, subtitle, center = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`max-w-2xl ${center ? 'mx-auto text-center' : ''}`}
    >
      <p className="font-mono text-sm text-accent">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-muted">{subtitle}</p>}
    </motion.div>
  )
}