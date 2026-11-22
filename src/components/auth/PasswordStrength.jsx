import { passwordStrength } from '../../lib/validators'

const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong']
const colors = ['bg-red-500', 'bg-red-500', 'bg-amber-400', 'bg-lime-500', 'bg-emerald-500']

export default function PasswordStrength({ value }) {
  if (!value) return null
  const score = passwordStrength(value)

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i <= score ? colors[score] : 'bg-border'
            }`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted">
        Strength: <span className="text-content">{labels[score]}</span>
      </p>
    </div>
  )
}