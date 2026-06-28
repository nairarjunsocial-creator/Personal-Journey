import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { PasswordModal } from '@/components/PasswordModal'
import { useDiarySession } from '@/context/DiarySessionContext'
import { useJournalLookups } from '@/context/JournalLookupsContext'
import { insertEntry, updateEntry, uploadCoverImage } from '@/lib/mutations'
import { isSupabaseConfigured } from '@/lib/supabase'
import { FALLBACK_CATEGORY_LABELS, FALLBACK_MOODS } from '@/lib/journalLookups'

export function NewEntryPage() {
  const navigate = useNavigate()
  const { hasPassword, getWritePassword, tryUnlock } = useDiarySession()
  const { categoryLabels, moods } = useJournalLookups()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [category, setCategory] = useState<string>(FALLBACK_CATEGORY_LABELS[0])
  const [location, setLocation] = useState('')
  const [mood, setMood] = useState<string>(FALLBACK_MOODS[0].slug)

  useEffect(() => {
    if (categoryLabels.length === 0) return
    queueMicrotask(() => {
      setCategory((c) => (categoryLabels.includes(c) ? c : categoryLabels[0]))
    })
  }, [categoryLabels])

  useEffect(() => {
    if (moods.length === 0) return
    queueMicrotask(() => {
      setMood((m) => (moods.some((x) => x.slug === m) ? m : moods[0].slug))
    })
  }, [moods])
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [pwOpen, setPwOpen] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  const save = async (password: string) => {
    setSaving(true)
    setFormError(null)
    const row = {
      title: title.trim() || null,
      body: body.trim() || null,
      date,
      category,
      location: location.trim() || null,
      mood,
      cover_image_url: null as string | null,
    }

    const { data, error } = await insertEntry(password, row)
    if (error || !data) {
      setSaving(false)
      setFormError(error ?? 'Could not create entry')
      return
    }

    if (file) {
      const { publicUrl, error: upErr } = await uploadCoverImage(file, data.id)
      if (upErr) {
        setSaving(false)
        setFormError(`Saved entry but cover upload failed: ${upErr}`)
        navigate(`/entry/${data.id}`)
        return
      }
      if (publicUrl) {
        const { error: upRowErr } = await updateEntry(password, {
          id: data.id,
          cover_image_url: publicUrl,
        })
        if (upRowErr) {
          setSaving(false)
          setFormError(`Cover uploaded but URL not saved: ${upRowErr}`)
          navigate(`/entry/${data.id}`)
          return
        }
      }
    }

    setSaving(false)
    navigate(`/entry/${data.id}`)
  }

  const submit = () => {
    setFormError(null)
    if (!hasPassword) {
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
    return (
      <p className="text-ink-700">
        Compose is unavailable — the journal is not connected.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-2xl font-semibold text-ink-900">New entry</h2>

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
              {categoryLabels.map((c) => (
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
            placeholder="First day in Tokyo"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-ink-800">
            Location (optional)
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2 text-ink-800 outline-none focus:ring-2 focus:ring-amber-500/30"
              placeholder="Kyoto, Japan"
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
          Cover image (optional)
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
            placeholder="Write what you want to remember…"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={submit}
            className="rounded-xl bg-ink-800 px-5 py-2.5 font-medium text-cream-50 hover:bg-ink-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save entry'}
          </button>
          <Link
            to="/"
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
