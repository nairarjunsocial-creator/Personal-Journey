import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchEntriesPage, fetchEntryDatesForCalendar, isSupabaseConfigured } from '@/lib/supabase'

export function CalendarPage() {
  const [cursor, setCursor] = useState(() => new Date())
  const [datesWithEntries, setDatesWithEntries] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const year = cursor.getFullYear()
  const month = cursor.getMonth() + 1

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) return
    setLoading(true)
    const { dates, error } = await fetchEntryDatesForCalendar({ year, month })
    setLoading(false)
    if (!error) setDatesWithEntries(dates)
  }, [year, month])

  useEffect(() => {
    queueMicrotask(() => {
      void refresh()
    })
  }, [refresh])

  const gridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [cursor])

  const label = format(cursor, 'MMMM yyyy')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-serif text-2xl font-semibold text-ink-900">Calendar</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous month"
            className="rounded-xl border border-cream-200 bg-white p-2 text-ink-800 hover:border-amber-200"
            onClick={() => setCursor((d) => addMonths(d, -1))}
          >
            <ChevronLeft className="size-5" />
          </button>
          <span className="min-w-[10rem] text-center font-medium text-ink-800">{label}</span>
          <button
            type="button"
            aria-label="Next month"
            className="rounded-xl border border-cream-200 bg-white p-2 text-ink-800 hover:border-amber-200"
            onClick={() => setCursor((d) => addMonths(d, 1))}
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      {!isSupabaseConfigured ? (
        <p className="text-ink-700">Calendar is unavailable — the journal is not connected.</p>
      ) : null}

      {isSupabaseConfigured ? (
        <div className="overflow-x-auto rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-ink-700 sm:text-sm">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
            {gridDays.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const inMonth = isSameMonth(day, cursor)
              const has = datesWithEntries.has(key)
              const today = isToday(day)
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!inMonth}
                  onClick={() => inMonth && has && setSelected(key)}
                  className={[
                    'aspect-square max-h-12 rounded-xl text-sm transition sm:max-h-14',
                    !inMonth ? 'text-ink-700/30' : 'text-ink-800',
                    today ? 'ring-2 ring-amber-400/80' : '',
                    has && inMonth
                      ? 'bg-amber-100 font-semibold text-ink-900 hover:bg-amber-200'
                      : inMonth
                        ? 'hover:bg-cream-100'
                        : '',
                  ].join(' ')}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>
          {loading ? (
            <p className="mt-3 text-center text-sm text-ink-700">Updating month…</p>
          ) : null}
        </div>
      ) : null}

      {selected && isSupabaseConfigured ? (
        <DayEntriesPanel date={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  )
}

function DayEntriesPanel({ date, onClose }: { date: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true)
  const [ids, setIds] = useState<{ id: string; title: string | null }[]>([])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      const { data, error } = await fetchEntriesPage({ from: 0, to: 499 })
      if (cancelled) return
      setLoading(false)
      if (error) {
        setIds([])
        return
      }
      const rows = data.filter((e) => e.date === date)
      setIds(rows.map((e) => ({ id: e.id, title: e.title })))
    })()
    return () => {
      cancelled = true
    }
  }, [date])

  const label = format(new Date(date + 'T12:00:00'), 'MMMM d, yyyy')

  return (
    <div className="rounded-2xl border border-cream-200 bg-cream-100/50 p-6">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-serif text-lg font-semibold text-ink-900">{label}</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-ink-700 hover:text-amber-600"
        >
          Close
        </button>
      </div>
      {loading ? (
        <p className="mt-3 text-ink-700">Loading entries…</p>
      ) : ids.length === 0 ? (
        <p className="mt-3 text-ink-700">No entries for this day.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {ids.map((e) => (
            <li key={e.id}>
              <Link
                to={`/entry/${e.id}`}
                className="font-medium text-amber-700 underline decoration-amber-500/40 hover:decoration-amber-600"
              >
                {e.title?.trim() || 'Untitled'}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
