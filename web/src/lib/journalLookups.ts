import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import type { JournalMoodOption } from '@/types/journal'
import { CATEGORY_OPTIONS, MOOD_OPTIONS } from '@/types/entry'

export const FALLBACK_CATEGORY_LABELS: string[] = [...CATEGORY_OPTIONS]

export const FALLBACK_MOODS: JournalMoodOption[] = MOOD_OPTIONS.map((m) => ({
  slug: m.value,
  label: m.label,
  emoji: m.emoji,
}))

export async function fetchJournalCategoryLabels(): Promise<string[]> {
  if (!isSupabaseConfigured) return FALLBACK_CATEGORY_LABELS
  const supabase = getSupabase()
  if (!supabase) return FALLBACK_CATEGORY_LABELS

  const { data, error } = await supabase
    .from('journal_categories')
    .select('label, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('label', { ascending: true })

  if (error || !data?.length) return FALLBACK_CATEGORY_LABELS
  return data.map((r: { label: string }) => r.label)
}

export async function fetchJournalMoods(): Promise<JournalMoodOption[]> {
  if (!isSupabaseConfigured) return FALLBACK_MOODS
  const supabase = getSupabase()
  if (!supabase) return FALLBACK_MOODS

  const { data, error } = await supabase
    .from('journal_moods')
    .select('slug, label, emoji, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('label', { ascending: true })

  if (error || !data?.length) return FALLBACK_MOODS
  return (data as { slug: string; label: string; emoji: string | null }[]).map((r) => ({
    slug: r.slug,
    label: r.label,
    emoji: r.emoji,
  }))
}

export function moodDisplay(slug: string | null, moods: JournalMoodOption[]): string | null {
  if (!slug) return null
  const m = moods.find((x) => x.slug === slug)
  if (!m) return null
  return m.emoji ? `${m.emoji} ${m.label}` : m.label
}

/** Ensure a stored category string appears in the select even if removed from DB */
export function mergeCategoryOptions(labels: string[], current: string | null): string[] {
  const set = new Set(labels)
  if (current && current.trim() && !set.has(current)) {
    return [current, ...labels]
  }
  return labels
}
