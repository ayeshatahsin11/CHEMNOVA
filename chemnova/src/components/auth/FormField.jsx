import { useState } from 'react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function FormField({ id, label, icon: Icon, type = 'text', error, ...props }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            size={17}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted"
          />
        )}

        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-xl border bg-surface-2/60 py-3 pr-11 text-sm transition outline-none placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/15 ${
            Icon ? 'pl-11' : 'pl-4'
          } ${error ? 'border-red-500/70' : 'border-border'}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted transition hover:text-content"
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>

      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
          <AlertCircle size={13} /> {error}
        </p>
      )}
    </div>
  )
}