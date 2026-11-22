import { AlertCircle } from 'lucide-react'

export default function FormAlert({ message }) {
  if (!message) return null

  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500"
    >
      <AlertCircle size={17} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}