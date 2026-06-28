import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { PasswordModal } from '@/components/PasswordModal'
import { useDiarySession } from '@/context/DiarySessionContext'
import { deleteEntry } from '@/lib/mutations'
import { fetchEntryById, isSupabaseConfigured } from '@/lib/supabase'
import type { DiaryEntry } from '@/types/entry'
import { useJournalLookups } from '@/context/JournalLookupsContext'
import { moodDisplay } from '@/lib/journalLookups'

export function EntryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasPassword, isUnlocked, tryUnlock } = useDiarySession()
  const { moods } = useJournalLookups()
  const [entry, setEntry] = useState<DiaryEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState(false)
  const [unlockOpen, setUnlockOpen] = useState(false)

  useEffect(() => {
    if (!id || !isSupabaseConfigured) {
      queueMicrotask(() => setLoading(false))
      return
    }
    let cancelled = false
    void (async () => {
      queueMicrotask(() => setLoading(true))
      const { data, error: err } = await fetchEntryById(id)
      if (cancelled) return
      setLoading(false)
      if (err) setError(err.message)
      else setEntry(data)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (!isSupabaseConfigured) {
    return <p className="text-charcoal-muted">This entry is unavailable — the journal is not connected.</p>
  }

  if (loading) {
    return <p className="animate-pulse text-sm text-charcoal-muted">Loading entry…</p>
  }

  if (error || !entry) {
    return (
      <div className="border border-red-300 bg-red-50 p-4 text-sm text-red-900">
        {error ?? 'Entry not found.'}{' '}
        <Link to="/" className="font-bold underline">
          Back to home
        </Link>
      </div>
    )
  }

  const dateLong = format(parseISO(entry.date), 'EEEE, MMMM d, yyyy')
  const dayNum = format(parseISO(entry.date), 'd')
  const monthShort = format(parseISO(entry.date), 'MMM').toUpperCase()
  const mood =
    moodDisplay(entry.mood, moods) ?? (entry.mood ? entry.mood.replace(/-/g, ' ') : null)

  const runDelete = async (password: string) => {
    setDeleteError(null)
    const { error: err } = await deleteEntry(password, entry.id)
    if (err) {
      setDeleteError(err)
      return
    }
    setDeleteOpen(false)
    navigate('/')
  }

  return (
    <article className="border border-rule bg-white">
      {entry.cover_image_url ? (
        <div className="aspect-[21/9] w-full border-b border-rule bg-paper-2">
          <img
            src={entry.cover_image_url}
            alt=""
            className="size-full object-cover"
          />
        </div>
      ) : null}

      <div className="space-y-0 p-0">
        <div className="border-b border-rule px-6 py-6 sm:px-10 sm:py-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-charcoal-muted hover:text-editorial"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </Link>

          <header className="mt-6 space-y-4">
            <h1 className="font-serif text-3xl font-bold leading-tight text-charcoal sm:text-4xl md:text-[2.75rem]">
              {entry.title?.trim() || 'Untitled entry'}
            </h1>
          </header>

          <div className="mt-6 grid grid-cols-2 border border-rule text-sm">
            <div className="border-r border-b border-rule px-3 py-3 uppercase tracking-wide text-charcoal-muted">
              <span className="block text-[0.65rem] font-semibold">Date</span>
              <time className="font-medium normal-case text-charcoal" dateTime={entry.date}>
                {dateLong}
              </time>
            </div>
            <div className="border-b border-rule px-3 py-3 uppercase tracking-wide text-charcoal-muted">
              <span className="block text-[0.65rem] font-semibold">Category</span>
              <span className="font-medium normal-case text-charcoal">{entry.category ?? '—'}</span>
            </div>
            <div className="border-r border-rule px-3 py-3 uppercase tracking-wide text-charcoal-muted">
              <span className="block text-[0.65rem] font-semibold">Mood</span>
              <span className="font-medium normal-case text-charcoal">
                {mood ?? '—'}
              </span>
            </div>
            <div className="px-3 py-3 uppercase tracking-wide text-charcoal-muted">
              <span className="block text-[0.65rem] font-semibold">Location</span>
              <span className="font-medium normal-case text-charcoal">{entry.location ?? '—'}</span>
            </div>
          </div>
        </div>

        <div className="border-b border-rule bg-paper px-6 py-8 sm:px-10 sm:py-10">
          <div className="mx-auto max-w-2xl whitespace-pre-wrap font-serif text-lg leading-[1.65] text-charcoal">
            {entry.body?.trim() || (
              <em className="text-charcoal-muted">No description.</em>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-10">
          <div className="flex flex-wrap gap-2">
            {hasPassword ? (
              <>
                <Link
                  to={`/edit/${entry.id}`}
                  className="inline-flex items-center gap-2 border border-rule bg-paper-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-charcoal hover:border-editorial hover:text-editorial"
                >
                  <Pencil className="size-4" aria-hidden />
                  Edit
                </Link>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 border border-red-300 bg-red-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-900 hover:bg-red-100"
                  onClick={() => {
                    if (!isUnlocked) {
                      setUnlockOpen(true)
                      return
                    }
                    setDeleteOpen(true)
                  }}
                >
                  <Trash2 className="size-4" aria-hidden />
                  Delete
                </button>
              </>
            ) : null}
          </div>
          <div className="flex flex-col items-end leading-none">
            <span className="font-serif text-4xl font-black tabular-nums text-charcoal">
              {dayNum}
            </span>
            <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-charcoal-muted">
              {monthShort}
            </span>
          </div>
        </div>
      </div>

      <PasswordModal
        open={unlockOpen}
        title="Unlock to continue"
        error={deleteError}
        onClose={() => {
          setUnlockOpen(false)
          setDeleteError(null)
        }}
        onSubmit={(password) => {
          if (tryUnlock(password)) {
            setUnlockOpen(false)
            setDeleteError(null)
          } else {
            setDeleteError('That password does not match.')
          }
        }}
      />

      <PasswordModal
        open={deleteOpen}
        title="Delete this entry?"
        error={deleteError}
        onClose={() => {
          if (!pendingDelete) {
            setDeleteOpen(false)
            setDeleteError(null)
          }
        }}
        onSubmit={async (password) => {
          setPendingDelete(true)
          setDeleteError(null)
          await runDelete(password)
          setPendingDelete(false)
        }}
      />
    </article>
  )
}
