import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureUserProfile } from '@/lib/supabase/account'
import { locales } from '@/i18n'

function localeFromPath(path: string): string {
  const segment = path.split('/').filter(Boolean)[0]
  return (locales as readonly string[]).includes(segment) ? segment : 'de'
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const locale = localeFromPath(next)

  if (!code) {
    return NextResponse.redirect(`${origin}/${locale}/login?authError=1`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/${locale}/login?authError=1`)
  }

  await ensureUserProfile(
    supabase,
    data.user.id,
    data.user.user_metadata?.full_name ?? null,
    data.user.email,
    true
  )

  return NextResponse.redirect(`${origin}${next}`)
}
