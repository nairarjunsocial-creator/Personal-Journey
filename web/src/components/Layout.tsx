import { NavLink, Outlet } from 'react-router-dom'
import { format } from 'date-fns'
import { BookOpen, CalendarDays, PenSquare, Search, Settings } from 'lucide-react'

const navLinkBase =
  'inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 border-l border-rule px-3 py-2.5 first:border-l-0 md:min-h-0 md:min-w-0 md:px-5 md:py-3'

const navLinkTypography =
  'text-center text-[0.65rem] font-semibold uppercase tracking-[0.12em] md:text-xs'

const navLinkState = ({ isActive }: { isActive: boolean }) =>
  [
    navLinkBase,
    navLinkTypography,
    isActive
      ? 'bg-editorial-soft text-editorial'
      : 'text-charcoal-muted hover:bg-paper-2 hover:text-charcoal',
  ].join(' ')

export function Layout() {
  const dateline = format(new Date(), 'dd MMM yyyy').toUpperCase()

  return (
    <div className="paper-surface min-h-svh bg-paper text-charcoal">
      <header className="border-b border-rule bg-paper/95">
        <div className="mx-auto max-w-5xl px-4 pt-4 sm:px-8 sm:pt-6">
          <div className="py-8 text-center">
            <h1 className="font-serif text-[1.75rem] font-black uppercase leading-none tracking-[0.08em] text-charcoal sm:text-4xl md:text-5xl">
              Personal Journal
            </h1>
            <p className="mt-2 font-serif text-sm italic text-charcoal-muted sm:text-base">
              trips, milestones &amp; everyday life
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <span className="dateline-rule" />
            <span className="text-editorial">◆</span>
            <time
              dateTime={format(new Date(), 'yyyy-MM-dd')}
              className="shrink-0 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-charcoal-muted sm:text-xs"
            >
              {dateline}
            </time>
            <span className="text-editorial">◆</span>
            <span className="dateline-rule" />
          </div>

          <div className="mt-6 flex justify-center">
            <nav
              className="inline-flex max-w-full overflow-x-auto border border-rule bg-white [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Main"
            >
              <NavLink to="/" end className={navLinkState} aria-label="Home">
                <BookOpen className="size-5 shrink-0 opacity-90 md:size-4" aria-hidden />
                <span className="hidden md:inline">Home</span>
              </NavLink>
              <NavLink to="/new" className={navLinkState} aria-label="New entry">
                <PenSquare className="size-5 shrink-0 opacity-90 md:size-4" aria-hidden />
                <span className="hidden md:inline">New entry</span>
              </NavLink>
              <NavLink to="/calendar" className={navLinkState} aria-label="Calendar">
                <CalendarDays className="size-5 shrink-0 opacity-90 md:size-4" aria-hidden />
                <span className="hidden md:inline">Calendar</span>
              </NavLink>
              <NavLink to="/search" className={navLinkState} aria-label="Search">
                <Search className="size-5 shrink-0 opacity-90 md:size-4" aria-hidden />
                <span className="hidden md:inline">Search</span>
              </NavLink>
              <NavLink to="/settings" className={navLinkState} aria-label="Settings">
                <Settings className="size-5 shrink-0 opacity-90 md:size-4" aria-hidden />
                <span className="hidden md:inline">Settings</span>
              </NavLink>
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
        <Outlet />
      </main>
    </div>
  )
}
