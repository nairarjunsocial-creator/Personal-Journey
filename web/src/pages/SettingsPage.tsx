import { useState } from 'react'
import { useDiarySession } from '@/context/DiarySessionContext'

export function SettingsPage() {
  const { hasPassword, isUnlocked, setPassword, changePassword, lock } = useDiarySession()
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [currentPw, setCurrentPw] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-serif text-2xl font-semibold text-ink-900">Settings</h2>
        <p className="mt-2 text-sm text-ink-700">
          Set a diary password to compose, edit, and delete entries on this device.
        </p>
      </header>

      <section className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
        <h3 className="font-medium text-ink-900">Diary password</h3>
        <p className="mt-2 text-sm text-ink-700">
          Your password unlocks writing for about 30 minutes. You will be asked again when saving if
          the session has expired.
        </p>

        {!hasPassword ? (
          <form
            className="mt-4 flex max-w-md flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              setMessage(null)
              if (newPw.length < 8) {
                setMessage('Use at least 8 characters.')
                return
              }
              if (newPw !== confirmPw) {
                setMessage('Passwords do not match.')
                return
              }
              setPassword(newPw)
              setNewPw('')
              setConfirmPw('')
              setMessage('Password saved. You can compose a new entry now.')
            }}
          >
            <label className="text-sm font-medium text-ink-800">
              New password
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2"
                autoComplete="new-password"
              />
            </label>
            <label className="text-sm font-medium text-ink-800">
              Confirm
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2"
                autoComplete="new-password"
              />
            </label>
            <button
              type="submit"
              className="rounded-xl bg-ink-800 px-4 py-2 font-medium text-cream-50 hover:bg-ink-700"
            >
              Save password
            </button>
          </form>
        ) : (
          <form
            className="mt-4 flex max-w-md flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              setMessage(null)
              if (newPw.length < 8) {
                setMessage('Use at least 8 characters.')
                return
              }
              if (newPw !== confirmPw) {
                setMessage('Passwords do not match.')
                return
              }
              if (!changePassword(currentPw, newPw)) {
                setMessage('Current password is incorrect.')
                return
              }
              setCurrentPw('')
              setNewPw('')
              setConfirmPw('')
              setMessage('Password updated.')
            }}
          >
            <p className="text-sm text-ink-700">
              Write session: {isUnlocked ? 'unlocked' : 'locked'}
            </p>
            <label className="text-sm font-medium text-ink-800">
              Current password
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2"
              />
            </label>
            <label className="text-sm font-medium text-ink-800">
              New password
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2"
              />
            </label>
            <label className="text-sm font-medium text-ink-800">
              Confirm new
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded-xl bg-ink-800 px-4 py-2 font-medium text-cream-50 hover:bg-ink-700"
              >
                Change password
              </button>
              <button
                type="button"
                onClick={() => lock()}
                className="rounded-xl border border-cream-200 px-4 py-2 font-medium text-ink-800 hover:bg-cream-50"
              >
                Lock session
              </button>
            </div>
          </form>
        )}
      </section>

      {message ? (
        <p className="text-sm text-ink-800" role="status">
          {message}
        </p>
      ) : null}
    </div>
  )
}
