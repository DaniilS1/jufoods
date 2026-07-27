import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
})

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 422 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Caps repeated current-password guesses against a hijacked/leaked session —
    // Supabase's own signInWithPassword rate limit is project-wide, not per-account.
    const allowed = await checkRateLimit(`account:password:${user.id}`, 5, 10 * 60)
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests, please try again later' }, { status: 429 })
    }

    // Re-authenticate before allowing the change: without this, a hijacked/leaked
    // session could silently take over the account by changing the password with
    // no proof the caller actually knows the current one.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: parsed.data.currentPassword,
    })

    if (reauthError) {
      return NextResponse.json({ error: 'invalid_current_password' }, { status: 400 })
    }

    const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PUT /api/account/password', error)
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
  }
}
