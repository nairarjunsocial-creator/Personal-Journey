import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { useJournalLookups } from '@/context/JournalLookupsContext'
import { moodDisplay } from '@/lib/journalLookups'
import type { DiaryEntry } from '@/types/entry'

function excerpt(body: string | null, max = 140): string {
  if (!body) return 'No description yet.'
  const t = body.trim().replace(/\s+/g, ' ')
  return t.length <= max ? t : `${t.slice(0, max)}…`
}

type Props = { entry: DiaryEntry }

export function EntryCard({ entry }: Props) {
  const { moods } = useJournalLookups()
  const dateLabel = format(parseISO(entry.date), 'MMM d, yyyy')
  const dayNum = format(parseISO(entry.date), 'd')
  const monthShort = format(parseISO(entry.date), 'MMM').toUpperCase()
  const mood = moodDisplay(entry.mood, moods)

  return (
    <article className="group border border-rule bg-white shadow-none transition-colors hover:border-rule-dark">
      <Link to={`/entry/${entry.id}`} className="flex flex-col">
        {entry.cover_image_url ? (
          <div className="aspect-[16/10] w-full border-b border-rule bg-paper-2">
            <img
              src={entry.cover_image_url}
              alt=""
              className="size-full object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-[16/10] w-full items-center justify-center border-b border-rule bg-paper-2">
            <span className="font-serif text-sm italic text-charcoal-muted">
              No photograph
            </span>
          </div>
        )}

        <div className="flex flex-col gap-0 p-0 text-left">
          <h2 className="border-b border-rule px-4 py-4 font-serif text-xl font-bold leading-tight text-charcoal group-hover:text-editorial sm:text-2xl">
            {entry.title?.trim() || 'Untitled entry'}
          </h2>

          <div className="grid grid-cols-2 border-b border-rule text-xs sm:text-sm">
            <div className="border-r border-rule px-3 py-2.5 uppercase tracking-wide text-charcoal-muted">
              <span className="block text-[0.65rem] font-semibold">Category</span>
              <span className="font-medium text-charcoal">
                {entry.category ?? '—'}
              </span>
            </div>
            <div className="px-3 py-2.5 uppercase tracking-wide text-charcoal-muted">
              <span className="block text-[0.65rem] font-semibold">Mood</span>
              <span className="font-medium text-charcoal">{mood ?? '—'}</span>
            </div>
            <div className="border-r border-t border-rule px-3 py-2.5 uppercase tracking-wide text-charcoal-muted">
              <span className="block text-[0.65rem] font-semibold">Date</span>
              <span className="font-medium text-charcoal">{dateLabel}</span>
            </div>
            <div className="border-t border-rule px-3 py-2.5 uppercase tracking-wide text-charcoal-muted">
              <span className="block text-[0.65rem] font-semibold">Location</span>
              <span className="font-medium text-charcoal">
                {entry.location ?? '—'}
              </span>
            </div>
          </div>

          <p className="border-b border-rule px-4 py-3 text-sm leading-relaxed text-charcoal-muted">
            {excerpt(entry.body)}
          </p>

          <div className="flex items-stretch justify-between gap-3 px-4 py-3">
            <span className="inline-flex items-center bg-editorial px-4 py-2 text-xs font-bold uppercase tracking-wider text-white group-hover:bg-editorial-hover">
              Read entry
            </span>
            <div className="flex flex-col items-end justify-center text-right leading-none">
              <span className="font-serif text-3xl font-black tabular-nums text-charcoal">
                {dayNum}
              </span>
              <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-charcoal-muted">
                {monthShort}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
}

export function EntryCardSkeleton() {
  return (
    <div className="animate-pulse border border-rule bg-white">
      <div className="aspect-[16/10] w-full bg-rule" />
      <div className="h-16 border-b border-rule bg-paper-2" />
      <div className="grid grid-cols-2 border-b border-rule">
        <div className="h-14 border-r border-rule bg-paper-2" />
        <div className="h-14 bg-paper-2" />
        <div className="h-14 border-r border-t border-rule bg-paper-2" />
        <div className="h-14 border-t border-rule bg-paper-2" />
      </div>
      <div className="space-y-2 border-b border-rule px-4 py-3">
        <div className="h-3 w-full bg-rule" />
        <div className="h-3 w-4/5 bg-rule" />
      </div>
      <div className="flex justify-between px-4 py-3">
        <div className="h-9 w-28 bg-rule" />
        <div className="h-10 w-14 bg-rule" />
      </div>
    </div>
  )
}
