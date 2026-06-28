import { useId, useState } from 'react'
import { Lock } from 'lucide-react'

type Props = {
  open: boolean
  title: string
  onClose: () => void
  onSubmit: (password: string) => void
  error?: string | null
}

export function PasswordModal({ open, title, onClose, onSubmit, error }: Props) {
  const id = useId()
  const [value, setValue] = useState('')

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md border border-rule bg-paper p-6 shadow-2xl sm:p-8">
        <div className="mb-5 border-b border-rule pb-4">
          <div className="mb-2 flex items-center gap-2 text-charcoal">
            <Lock className="size-5 shrink-0 text-editorial" aria-hidden />
            <h2
              id={`${id}-title`}
              className="font-serif text-lg font-bold uppercase tracking-wide"
            >
              {title}
            </h2>
          </div>
          <p className="text-xs uppercase tracking-wider text-charcoal-muted">
            Editor&apos;s privilege required
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit(value)
            setValue('')
          }}
        >
          <label htmlFor={`${id}-pw`} className="sr-only">
            Diary password
          </label>
          <input
            id={`${id}-pw`}
            type="password"
            autoComplete="current-password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mb-3 w-full border border-rule bg-white px-4 py-3 text-charcoal outline-none ring-editorial/20 placeholder:text-charcoal-muted/60 focus:ring-2"
            placeholder="Enter your diary password"
          />
          {error ? (
            <p className="mb-3 border-l-2 border-editorial bg-editorial-soft px-3 py-2 text-sm text-editorial-hover" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2 border-t border-rule pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-charcoal-muted hover:text-charcoal"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-editorial px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-editorial-hover"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
