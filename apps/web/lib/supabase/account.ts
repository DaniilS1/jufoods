import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js'

export interface UserProfileRecord {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: 'customer' | 'admin'
  created_at: string
  updated_at: string
}

export interface UserSettingsRecord {
  id: string
  user_id: string
  preferred_language: string | null
  marketing_opt_in: boolean
  notifications_email: boolean
  created_at: string
  updated_at: string
}

export interface OrderRecord {
  id: string
  user_id: string | null
  items: unknown[] | null
  status: string
  created_at: string
  notes: unknown | null
}

export interface CustomDesignRecord {
  id: string
  user_id: string
  image_url: string
  notes: string | null
  created_at: string
  updated_at: string
}

type Supabase = SupabaseClient<any, 'public', any>

export async function ensureUserProfile(
  supabase: Supabase,
  userId: string,
  fullName?: string | null
): Promise<UserProfileRecord> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single()

  if (error && !isMissingRowError(error)) {
    throw new Error(error.message)
  }

  if (data) {
    return data as UserProfileRecord
  }

  const { data: inserted, error: insertError } = await supabase
    .from('users')
    .insert({ id: userId, role: 'customer', full_name: fullName ?? null })
    .select('*')
    .single()

  if (insertError) {
    throw new Error(insertError.message)
  }

  return inserted as UserProfileRecord
}

export async function updateUserProfile(
  supabase: Supabase,
  userId: string,
  payload: Partial<Pick<UserProfileRecord, 'full_name' | 'phone' | 'avatar_url'>>
): Promise<UserProfileRecord> {
  const { data, error } = await supabase
    .from('users')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as UserProfileRecord
}

export async function ensureUserSettings(supabase: Supabase, userId: string): Promise<UserSettingsRecord> {
  const { data, error } = await supabase.from('settings').select('*').eq('user_id', userId).single()

  if (error && !isMissingRowError(error)) {
    throw new Error(error.message)
  }

  if (data) {
    return data as UserSettingsRecord
  }

  const { data: inserted, error: insertError } = await supabase
    .from('settings')
    .insert({
      user_id: userId,
    })
    .select('*')
    .single()

  if (insertError) {
    throw new Error(insertError.message)
  }

  return inserted as UserSettingsRecord
}

export async function updateUserSettings(
  supabase: Supabase,
  userId: string,
  payload: Partial<Pick<UserSettingsRecord, 'preferred_language' | 'marketing_opt_in' | 'notifications_email'>>
): Promise<UserSettingsRecord> {
  const { data, error } = await supabase
    .from('settings')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as UserSettingsRecord
}

function isMissingRowError(error: PostgrestError | null): boolean {
  if (!error) return false
  return error.code === 'PGRST116' || error.details?.includes('Results contain 0 rows')
}

export async function fetchRecentOrders(supabase: Supabase, userId: string, limit = 5): Promise<OrderRecord[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, user_id, items, status, created_at, notes')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(error.message)
  }

  return (data as OrderRecord[]) ?? []
}

export async function listCustomDesigns(supabase: Supabase, userId: string): Promise<CustomDesignRecord[]> {
  const { data, error } = await supabase
    .from('custom_designs')
    .select('id, user_id, image_url, notes, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data as CustomDesignRecord[]) ?? []
}

export async function insertCustomDesign(
  supabase: Supabase,
  userId: string,
  payload: { image_url: string; notes?: string | null }
): Promise<CustomDesignRecord> {
  const { data, error } = await supabase
    .from('custom_designs')
    .insert({
      user_id: userId,
      image_url: payload.image_url,
      notes: payload.notes ?? null,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as CustomDesignRecord
}

