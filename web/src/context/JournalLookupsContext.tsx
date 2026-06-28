import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  FALLBACK_CATEGORY_LABELS,
  FALLBACK_MOODS,
  fetchJournalCategoryLabels,
  fetchJournalMoods,
} from '@/lib/journalLookups'
import type { JournalMoodOption } from '@/types/journal'

type Ctx = {
  categoryLabels: string[]
  moods: JournalMoodOption[]
  loading: boolean
  refresh: () => Promise<void>
}

const JournalLookupsContext = createContext<Ctx | null>(null)

export function JournalLookupsProvider({ children }: { children: ReactNode }) {
  const [categoryLabels, setCategoryLabels] = useState<string[]>(FALLBACK_CATEGORY_LABELS)
  const [moods, setMoods] = useState<JournalMoodOption[]>(FALLBACK_MOODS)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const [cats, ms] = await Promise.all([
      fetchJournalCategoryLabels(),
      fetchJournalMoods(),
    ])
    setCategoryLabels(cats)
    setMoods(ms)
    setLoading(false)
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void refresh()
    })
  }, [refresh])

  const value = useMemo(
    () => ({ categoryLabels, moods, loading, refresh }),
    [categoryLabels, moods, loading, refresh],
  )

  return (
    <JournalLookupsContext.Provider value={value}>
      {children}
    </JournalLookupsContext.Provider>
  )
}

// Colocated hook for this provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useJournalLookups(): Ctx {
  const ctx = useContext(JournalLookupsContext)
  if (!ctx) {
    throw new Error('useJournalLookups must be used within JournalLookupsProvider')
  }
  return ctx
}
