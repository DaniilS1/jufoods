import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Helper to check if an error is a known Supabase server-side issue
 * that can be safely ignored (e.g., schema mismatch errors)
 */
function isIgnorableAuthError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String(error.message)
    // Ignore server-side schema errors that indicate Supabase project needs update
    return (
      message.includes('refresh_token_hmac_key') ||
      message.includes('missing destination name') ||
      message.includes('unexpected_failure') ||
      message.includes('Auth session missing')
    )
  }
  return false
}

/**
 * Wrapper for getUser that handles known server-side errors gracefully
 */
export async function getUserSafely(supabase: ReturnType<typeof createServerClient>) {
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error && !isIgnorableAuthError(error)) {
      console.warn('Supabase auth error:', error.message)
    }
    return { data, error: isIgnorableAuthError(error) ? null : error }
  } catch (error) {
    if (isIgnorableAuthError(error)) {
      // Silently ignore known server-side schema errors
      return { data: { user: null }, error: null }
    }
    console.warn('Unexpected auth error:', error instanceof Error ? error.message : 'Unknown error')
    return { data: { user: null }, error: error as Error }
  }
}

export async function createClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.warn('Supabase environment variables are not configured')
    // Return a mock client that won't crash but will fail gracefully
    return createServerClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // No-op for placeholder
          },
        },
      }
    )
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

