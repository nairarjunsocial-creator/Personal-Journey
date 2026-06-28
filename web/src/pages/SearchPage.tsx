import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { EntryCard } from '@/components/EntryCard'
import { useJournalLookups } from '@/context/JournalLookupsContext'
import { searchEntries, isSupabaseConfigured } from '@/lib/supabase'
import type { DiaryEntry } from '@/types/entry'

export function SearchPage() {
  const { categoryLabels, moods } = useJournalLookups()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('')
  const [mood, setMood] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [results, setResults] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ran, setRan] = useState(false)

  const run = useCallback(async () => {
    if (!isSupabaseConfigured) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await searchEntries({
      query,
      category: category || null,
      mood: mood || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
    })
    setLoading(false)
    setRan(true)
    if (err) {
      setError(err.message)
      setResults([])
    } else {
      setResults(data)
    }
  }, [query, category, mood, dateFrom, dateTo])

  if (!isSupabaseConfigured) {
    return (
      <p className="text-ink-700">
        Search is unavailable — the journal is not connected.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-2xl font-semibold text-ink-900">Search & filter</h2>

      <div className="space-y-4 rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium text-ink-800">
          Keywords
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2 text-ink-800 outline-none focus:ring-2 focus:ring-amber-500/30"
            placeholder="Search title, body, location…"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-ink-800">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2 text-ink-800"
            >
              <option value="">Any</option>
              {categoryLabels.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-ink-800">
            Mood
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2 text-ink-800"
            >
              <option value="">Any</option>
              {moods.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.emoji ? `${m.emoji} ${m.label}` : m.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-ink-800">
            From
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium text-ink-800">
            To
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2"
            />
          </label>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => void run()}
          className="rounded-xl bg-ink-800 px-5 py-2.5 font-medium text-cream-50 hover:bg-ink-700 disabled:opacity-50"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">{error}</p>
      ) : null}

      {ran && !error ? (
        <div className="space-y-4">
          <p className="text-sm text-ink-700">
            {results.length} result{results.length === 1 ? '' : 's'}
          </p>
          {results.length === 0 ? (
            <p className="text-ink-700">Nothing matched. Try broader filters.</p>
          ) : (
            <ul className="flex flex-col gap-6">
              {results.map((e) => (
                <li key={e.id}>
                  <EntryCard entry={e} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <p className="text-sm text-ink-700">
        Browse all entries on the{' '}
        <Link to="/" className="font-medium text-amber-700 underline">
          home page
        </Link>
        .
      </p>
    </div>
  )
}
