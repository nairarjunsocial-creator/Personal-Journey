import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PasswordModal } from '@/components/PasswordModal'
import { useDiarySession } from '@/context/DiarySessionContext'
import { useJournalLookups } from '@/context/JournalLookupsContext'
import {
  FALLBACK_CATEGORY_LABELS,
  FALLBACK_MOODS,
  mergeCategoryOptions,
} from '@/lib/journalLookups'
import { updateEntry, uploadCoverImage } from '@/lib/mutations'
import { fetchEntryById, isSupabaseConfigured } from '@/lib/supabase'
import type { DiaryEntry } from '@/types/entry'

export function EditEntryPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasPassword, getWritePassword, tryUnlock } = useDiarySession()
  const { categoryLabels, moods } = useJournalLookups()
  const [entry, setEntry] = useState<DiaryEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [date, setDate] = useState('')
  const [category, setCategory] = useState<string>(FALLBACK_CATEGORY_LABELS[0])
  const [location, setLocation] = useState('')
  const [mood, setMood] = useState<string>(FALLBACK_MOODS[0].slug)

  const categorySelectOptions = useMemo(
    () => mergeCategoryOptions(categoryLabels, category),
    [categoryLabels, category],
  )

  const lookupSyncKey = useRef<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [pwOpen, setPwOpen] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !isSupabaseConfigured) {
      queueMicrotask(() => setLoading(false))
      return
    }
    let cancelled = false
    void (async () => {
      const { data, error } = await fetchEntryById(id)
      if (cancelled) return
      setLoading(false)
      if (error || !data) {
        setFormError(error?.message ?? 'Not found')
        return
      }
      setEntry(data)
      setTitle(data.title ?? '')
      setBody(data.body ?? '')
      setDate(data.date)
      setLocation(data.location ?? '')
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!entry || loading) return
    const fp = `${entry.id}|${categoryLabels.join('\t')}|${moods.map((m) => m.slug).join('\t')}`
    if (lookupSyncKey.current === fp) return
    lookupSyncKey.current = fp
    const catOpts = mergeCategoryOptions(categoryLabels, entry.category)
    const nextCat =
      entry.category && catOpts.includes(entry.category) ? entry.category : catOpts[0]
    const nextMood = moods.some((m) => m.slug === entry.mood)
      ? (entry.mood as string)
      : moods[0].slug
    queueMicrotask(() => {
      setCategory(nextCat)
      setMood(nextMood)
    })
  }, [entry, categoryLabels, moods, loading])

  const save = async (password: string) => {
    if (!entry) return
    setSaving(true)
    setFormError(null)

    let coverUrl = entry.cover_image_url
    if (file) {
      const { publicUrl, error: upErr } = await uploadCoverImage(file, entry.id)
      if (upErr) {
        setSaving(false)
        setFormError(upErr)
        return
      }
      coverUrl = publicUrl
    }

    const { error } = await updateEntry(password, {
      id: entry.id,
      title: title.trim() || null,
      body: body.trim() || null,
      date,
      category,
      location: location.trim() || null,
      mood,
      cover_image_url: coverUrl,
    })
    setSaving(false)
    if (error) {
      setFormError(error)
      return
    }
    navigate(`/entry/${entry.id}`)
  }

  const submit = () => {
    setFormError(null)
    if (!hasPassword || !entry) {
      setFormError('Set a diary password in Settings first.')
      return
    }
    const password = getWritePassword()
    if (password) {
      void save(password)
      return
    }
    setPwOpen(true)
  }

  if (!isSupabaseConfigured) {
    return <p className="text-ink-700">Edit is unavailable — the journal is not connected.</p>
  }

  if (loading) {
    return <p className="animate-pulse text-ink-700">Loading…</p>
  }

  if (!entry) {
    return (
      <p className="text-red-800">
        {formError ?? 'Missing entry.'}{' '}
        <Link to="/" className="underline">
          Home
        </Link>
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-2xl font-semibold text-ink-900">Edit entry</h2>

      {formError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="space-y-4 rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-ink-800">
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2 text-ink-800 outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </label>
          <label className="block text-sm font-medium text-ink-800">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2 text-ink-800 outline-none focus:ring-2 focus:ring-amber-500/30"
            >
              {categorySelectOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm font-medium text-ink-800">
          Title (optional)
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2 font-serif text-lg text-ink-900 outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-ink-800">
            Location (optional)
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2 text-ink-800 outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </label>
          <label className="block text-sm font-medium text-ink-800">
            Mood
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2 text-ink-800 outline-none focus:ring-2 focus:ring-amber-500/30"
            >
              {moods.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.emoji ? `${m.emoji} ${m.label}` : m.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm font-medium text-ink-800">
          Replace cover image (optional)
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm text-ink-700 file:mr-3 file:rounded-lg file:border-0 file:bg-ink-800 file:px-3 file:py-2 file:text-sm file:font-medium file:text-cream-50"
          />
        </label>

        <label className="block text-sm font-medium text-ink-800">
          Body
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2 text-ink-800 outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={submit}
            className="rounded-xl bg-ink-800 px-5 py-2.5 font-medium text-cream-50 hover:bg-ink-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <Link
            to={`/entry/${entry.id}`}
            className="rounded-xl border border-cream-200 bg-cream-50 px-5 py-2.5 font-medium text-ink-800 hover:border-amber-200"
          >
            Cancel
          </Link>
        </div>
      </div>

      <PasswordModal
        open={pwOpen}
        title="Confirm password"
        error={pwError}
        onClose={() => {
          setPwOpen(false)
          setPwError(null)
        }}
        onSubmit={(password) => {
          if (!tryUnlock(password)) {
            setPwError('That password does not match your diary password.')
            return
          }
          setPwOpen(false)
          setPwError(null)
          void save(password)
        }}
      />
    </div>
  )
}
