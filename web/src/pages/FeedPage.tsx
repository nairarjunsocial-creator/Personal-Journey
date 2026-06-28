import { useCallback, useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { EntryCard, EntryCardSkeleton } from '@/components/EntryCard'
import { fetchEntriesPage, isSupabaseConfigured } from '@/lib/supabase'
import type { DiaryEntry } from '@/types/entry'

const PAGE_SIZE = 10

function monthKey(dateIso: string): string {
  return format(parseISO(dateIso), 'yyyy-MM')
}

export function FeedPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const load = useCallback(async (pageIndex: number, append: boolean) => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      setError(null)
      setEntries([])
      return
    }
    setLoading(true)
    setError(null)
    const from = pageIndex * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data, error: err } = await fetchEntriesPage({ from, to })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    setHasMore(data.length === PAGE_SIZE)
    setEntries((prev) => (append ? [...prev, ...data] : data))
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void load(0, false)
    })
  }, [load])

  const grouped = useMemo(() => {
    const map: { label: string; items: DiaryEntry[] }[] = []
    for (const e of entries) {
      const key = monthKey(e.date)
      const label = format(parseISO(e.date), 'MMMM yyyy')
      const last = map[map.length - 1]
      if (last && monthKey(last.items[0].date) === key) {
        last.items.push(e)
      } else {
        map.push({ label, items: [e] })
      }
    }
    return map
  }, [entries])

  if (!isSupabaseConfigured) {
    return (
      <div className="border border-rule bg-editorial-soft p-6 text-charcoal sm:p-8">
        <h2 className="font-serif text-xl font-bold uppercase tracking-wide text-editorial">
          Journal unavailable
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-charcoal-muted">
          This site is not connected to a journal database yet.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="border-b border-rule pb-6">
        <h2 className="font-serif text-xl font-bold text-charcoal">Recent entries</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal-muted">
          Newest first. Load more to see older posts.
        </p>
      </header>

      {error ? (
        <p
          className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {loading && entries.length === 0 ? (
        <ul className="flex flex-col gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i}>
              <EntryCardSkeleton />
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && entries.length === 0 ? (
        <div className="border border-rule bg-white px-6 py-12 text-center">
          <p className="font-serif text-lg italic text-charcoal-muted">No entries yet.</p>
          <p className="mt-2 text-sm text-charcoal-muted">
            Write your first entry from <strong className="text-charcoal">New entry</strong>.
          </p>
        </div>
      ) : null}

      {grouped.map((group) => (
        <section key={group.label} className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <h2 className="shrink-0 font-serif text-lg font-bold uppercase tracking-[0.12em] text-charcoal">
              {group.label}
            </h2>
            <span className="h-px min-w-[2rem] flex-1 bg-rule-dark" />
          </div>
          <ul className="flex flex-col gap-8">
            {group.items.map((e) => (
              <li key={e.id}>
                <EntryCard entry={e} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {entries.length > 0 && hasMore ? (
        <button
          type="button"
          className="mx-auto border border-rule bg-white px-8 py-3 text-xs font-bold uppercase tracking-widest text-charcoal transition-colors hover:border-editorial hover:text-editorial disabled:opacity-50"
          disabled={loading}
          onClick={() => {
            const next = page + 1
            setPage(next)
            void load(next, true)
          }}
        >
          {loading ? 'Loading…' : 'Load more'}
        </button>
      ) : null}
    </div>
  )
}
