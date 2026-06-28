/**
 * Supabase Edge Function (Deno): password-gated mutations for diary_entries.
 * Deploy: `supabase functions deploy diary-mutate --no-verify-jwt`
 * Set secret: DIARY_WRITE_PASSWORD (plaintext shared secret for your single-user diary)
 *
 * Client calls supabase.functions.invoke('diary-mutate', { body: { ... } })
 * with Authorization: Bearer <password> or include password in JSON body (HTTPS only).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const secret = Deno.env.get('DIARY_WRITE_PASSWORD')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!secret) {
      console.error('DIARY_WRITE_PASSWORD not set')
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const auth = req.headers.get('Authorization') ?? ''
    const token = auth.replace(/^Bearer\s+/i, '').trim()
    const body = await req.json().catch(() => ({}))
  // supabase.functions.invoke always sends Authorization: Bearer <anon key>.
  // Prefer JSON body password; fall back to Bearer for manual curl/scripts.
    const password = (body as { password?: string }).password || token

    if (!password || password !== secret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(supabaseUrl, serviceKey)
    const action = (body as { action?: string }).action
    const payload = (body as { payload?: Record<string, unknown> }).payload ?? {}

    switch (action) {
      case 'insert': {
        const { data, error } = await admin.from('diary_entries').insert(payload).select().single()
        if (error) throw error
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      case 'update': {
        const id = payload.id as string
        const rest = { ...payload }
        delete rest.id
        const { data, error } = await admin
          .from('diary_entries')
          .update(rest)
          .eq('id', id)
          .select()
          .single()
        if (error) throw error
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      case 'delete': {
        const id = payload.id as string
        const { error } = await admin.from('diary_entries').delete().eq('id', id)
        if (error) throw error
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
