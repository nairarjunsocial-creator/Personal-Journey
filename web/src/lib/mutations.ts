import { getSupabase } from '@/lib/supabase'
import type { DiaryEntry } from '@/types/entry'

type MutateResult<T> = { data: T | null; error: string | null }

async function formatInvokeError(e: unknown): Promise<string> {
  if (!e || typeof e !== 'object') return 'Unknown error'
  const anyE = e as {
    message?: string
    name?: string
    context?: Response
  }

  let detail: string | null = null
  const response = anyE.context
  if (response && typeof response.json === 'function') {
    try {
      const body = (await response.clone().json()) as { error?: string }
      if (body?.error) detail = body.error
    } catch {
      /* ignore */
    }
  }

  const status = response?.status
  const statusText = response?.statusText
  const base = anyE.message || 'Request failed'

  if (detail === 'Unauthorized') {
    return 'Diary password rejected by server. Ensure Settings password matches Supabase secret DIARY_WRITE_PASSWORD exactly.'
  }
  if (detail === 'Server misconfigured') {
    return 'Edge Function missing DIARY_WRITE_PASSWORD secret. Set it in Supabase → Edge Functions → Secrets.'
  }
  if (detail) return detail

  if (base.includes('Failed to send a request to the Edge Function')) {
    return [
      base,
      status ? `HTTP ${status}${statusText ? ` ${statusText}` : ''}` : null,
      'Fix: deploy `diary-mutate` (Edge Function) and set DIARY_WRITE_PASSWORD + SUPABASE_SERVICE_ROLE_KEY secrets. Deploy with `--no-verify-jwt` if calling anonymously.',
    ]
      .filter(Boolean)
      .join(' — ')
  }

  return status ? `${base} (HTTP ${status}${statusText ? ` ${statusText}` : ''})` : base
}

export async function insertEntry(
  password: string,
  row: Omit<
    DiaryEntry,
    'id' | 'created_at' | 'updated_at'
  >,
): Promise<MutateResult<DiaryEntry>> {
  const supabase = getSupabase()
  if (!supabase) return { data: null, error: 'Supabase is not configured' }

  const { data, error } = await supabase.functions.invoke('diary-mutate', {
    body: { action: 'insert', payload: row, password },
  })

  if (error) return { data: null, error: await formatInvokeError(error) }
  const errMsg = (data as { error?: string })?.error
  if (errMsg) return { data: null, error: errMsg }
  return { data: (data as { data: DiaryEntry }).data, error: null }
}

export async function updateEntry(
  password: string,
  row: Partial<DiaryEntry> & { id: string },
): Promise<MutateResult<DiaryEntry>> {
  const supabase = getSupabase()
  if (!supabase) return { data: null, error: 'Supabase is not configured' }

  const { data, error } = await supabase.functions.invoke('diary-mutate', {
    body: { action: 'update', payload: row, password },
  })

  if (error) return { data: null, error: await formatInvokeError(error) }
  const errMsg = (data as { error?: string })?.error
  if (errMsg) return { data: null, error: errMsg }
  return { data: (data as { data: DiaryEntry }).data, error: null }
}

export async function deleteEntry(
  password: string,
  id: string,
): Promise<MutateResult<null>> {
  const supabase = getSupabase()
  if (!supabase) return { data: null, error: 'Supabase is not configured' }

  const { data, error } = await supabase.functions.invoke('diary-mutate', {
    body: { action: 'delete', payload: { id }, password },
  })

  if (error) return { data: null, error: await formatInvokeError(error) }
  const errMsg = (data as { error?: string })?.error
  if (errMsg) return { data: null, error: errMsg }
  return { data: null, error: null }
}

export async function uploadCoverImage(
  file: File,
  entryId: string,
): Promise<{ publicUrl: string | null; error: string | null }> {
  const supabase = getSupabase()
  if (!supabase) return { publicUrl: null, error: 'Supabase is not configured' }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${entryId}/cover.${ext}`

  const { error: upErr } = await supabase.storage.from('covers').upload(path, file, {
    upsert: true,
    contentType: file.type || 'image/jpeg',
  })

  if (upErr) return { publicUrl: null, error: upErr.message }

  const { data } = supabase.storage.from('covers').getPublicUrl(path)
  return { publicUrl: data.publicUrl, error: null }
}
