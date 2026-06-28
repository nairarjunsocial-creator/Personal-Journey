import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { DiaryEntry } from '@/types/entry'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(
  url && anon && !url.includes('your-project') && anon !== 'your-anon-key',
)

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured || !url || !anon) return null
  if (!client) client = createClient(url, anon)
  return client
}

export async function fetchEntriesPage(params: {
  from: number
  to: number
}): Promise<{ data: DiaryEntry[]; error: Error | null }> {
  const supabase = getSupabase()
  if (!supabase) {
    return { data: [], error: new Error('Supabase is not configured') }
  }
  const { data, error } = await supabase
    .from('diary_entries')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(params.from, params.to)

  if (error) return { data: [], error: new Error(error.message) }
  return { data: (data ?? []) as DiaryEntry[], error: null }
}

export async function fetchEntryById(
  id: string,
): Promise<{ data: DiaryEntry | null; error: Error | null }> {
  const supabase = getSupabase()
  if (!supabase) {
    return { data: null, error: new Error('Supabase is not configured') }
  }
  const { data, error } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) return { data: null, error: new Error(error.message) }
  return { data: data as DiaryEntry | null, error: null }
}

export async function fetchEntryDatesForCalendar(params: {
  year: number
  month: number
}): Promise<{ dates: Set<string>; error: Error | null }> {
  const supabase = getSupabase()
  if (!supabase) {
    return { dates: new Set(), error: new Error('Supabase is not configured') }
  }
  const start = `${params.year}-${String(params.month).padStart(2, '0')}-01`
  const lastDay = new Date(params.year, params.month, 0).getDate()
  const end = `${params.year}-${String(params.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('diary_entries')
    .select('date')
    .gte('date', start)
    .lte('date', end)

  if (error) return { dates: new Set(), error: new Error(error.message) }
  const dates = new Set((data ?? []).map((r: { date: string }) => r.date))
  return { dates, error: null }
}

export async function searchEntries(filters: {
  query: string
  category: string | null
  mood: string | null
  dateFrom: string | null
  dateTo: string | null
}): Promise<{ data: DiaryEntry[]; error: Error | null }> {
  const supabase = getSupabase()
  if (!supabase) {
    return { data: [], error: new Error('Supabase is not configured') }
  }

  let q = supabase.from('diary_entries').select('*').order('date', { ascending: false })

  if (filters.category) q = q.eq('category', filters.category)
  if (filters.mood) q = q.eq('mood', filters.mood)
  if (filters.dateFrom) q = q.gte('date', filters.dateFrom)
  if (filters.dateTo) q = q.lte('date', filters.dateTo)

  const { data, error } = await q

  if (error) return { data: [], error: new Error(error.message) }
  let rows = (data ?? []) as DiaryEntry[]

  const t = filters.query.trim().toLowerCase()
  if (t) {
    rows = rows.filter(
      (e) =>
        (e.title?.toLowerCase().includes(t) ?? false) ||
        (e.body?.toLowerCase().includes(t) ?? false) ||
        (e.location?.toLowerCase().includes(t) ?? false),
    )
  }

  return { data: rows, error: null }
}
