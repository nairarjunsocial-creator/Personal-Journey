export type DiaryEntry = {
  id: string
  title: string | null
  body: string | null
  date: string
  category: string | null
  location: string | null
  mood: string | null
  cover_image_url: string | null
  created_at: string
  updated_at: string
}

export const MOOD_OPTIONS = [
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'grateful', label: 'Grateful', emoji: '🙏' },
  { value: 'excited', label: 'Excited', emoji: '✨' },
  { value: 'reflective', label: 'Reflective', emoji: '💭' },
  { value: 'calm', label: 'Calm', emoji: '🌿' },
  { value: 'sad', label: 'Sad', emoji: '💙' },
] as const

export const CATEGORY_OPTIONS = [
  'Travel',
  'Life update',
  'Food',
  'Milestone',
  'Reflection',
  'Daily',
] as const
