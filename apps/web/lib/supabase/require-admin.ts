import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

export type AdminGateResult =
  | { ok: true; supabase: SupabaseClient; user: User }
  | { ok: false; status: 401 | 403; message: string }

export async function requireAdmin(): Promise<AdminGateResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, status: 401, message: 'Unauthorized' }
  }

  const { data: row } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (row?.role !== 'admin') {
    return { ok: false, status: 403, message: 'Forbidden' }
  }

  return { ok: true, supabase, user }
}
