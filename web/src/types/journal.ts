export type JournalCategoryRow = {
  id: string
  slug: string
  label: string
  sort_order: number
  is_active: boolean
}

export type JournalMoodRow = {
  id: string
  slug: string
  label: string
  emoji: string | null
  sort_order: number
  is_active: boolean
}

/** Normalized mood for selects and display */
export type JournalMoodOption = {
  slug: string
  label: string
  emoji: string | null
}
