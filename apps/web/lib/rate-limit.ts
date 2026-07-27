import { createServiceRoleClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'

/** Best-effort client IP extraction behind typical reverse proxies (Vercel, nginx). */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

/**
 * Returns true if the caller is still within the allowed rate and the attempt
 * was recorded; false if the limit was exceeded. Fails open (returns true) if
 * the service-role client or the DB call is unavailable, so a misconfigured
 * environment never blocks real traffic.
 */
export async function checkRateLimit(
  bucketKey: string,
  maxCount: number,
  windowSeconds: number
): Promise<boolean> {
  const admin = createServiceRoleClient()
  if (!admin) return true

  const { data, error } = await admin.rpc('check_and_record_rate_limit', {
    p_bucket_key: bucketKey,
    p_max_count: maxCount,
    p_window_seconds: windowSeconds,
  })

  if (error) {
    console.error('[rate-limit] check failed, failing open:', error.message)
    return true
  }

  return data === true
}
