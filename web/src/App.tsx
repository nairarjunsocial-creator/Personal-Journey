import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { DiarySessionProvider } from '@/context/DiarySessionContext'
import { JournalLookupsProvider } from '@/context/JournalLookupsContext'
import { CalendarPage } from '@/pages/CalendarPage'
import { EditEntryPage } from '@/pages/EditEntryPage'
import { EntryDetailPage } from '@/pages/EntryDetailPage'
import { FeedPage } from '@/pages/FeedPage'
import { NewEntryPage } from '@/pages/NewEntryPage'
import { SearchPage } from '@/pages/SearchPage'
import { SettingsPage } from '@/pages/SettingsPage'

export default function App() {
  return (
    <DiarySessionProvider>
      <JournalLookupsProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="guide" element={<Navigate to="/" replace />} />
            <Route index element={<FeedPage />} />
            <Route path="entry/:id" element={<EntryDetailPage />} />
            <Route path="new" element={<NewEntryPage />} />
            <Route path="edit/:id" element={<EditEntryPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </JournalLookupsProvider>
    </DiarySessionProvider>
  )
}
