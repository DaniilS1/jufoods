import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  ensureUserProfile,
  ensureUserSettings,
  updateUserProfile,
  updateUserSettings,
  type UserProfileRecord,
  type UserSettingsRecord,
} from '@/lib/supabase/account'

const updateSchema = z.object({
  fullName: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(32).nullable().optional(),
  preferredLanguage: z.enum(['de', 'uk']).optional(),
  marketingOptIn: z.boolean().optional(),
  notificationsEmail: z.boolean().optional(),
})

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [profile, settings] = await Promise.all([
      ensureUserProfile(supabase, user.id),
      ensureUserSettings(supabase, user.id),
    ])

    return NextResponse.json(serializeResponse(user.email, profile, settings))
  } catch (error) {
    console.error('GET /api/account/profile', error)
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 422 })
    }

    const payload = parsed.data
    let profile = await ensureUserProfile(supabase, user.id)
    let settings = await ensureUserSettings(supabase, user.id)

    const profilePatch: Record<string, unknown> = {}
    if (payload.fullName !== undefined) {
      profilePatch.full_name = payload.fullName
    }
    if (payload.phone !== undefined) {
      profilePatch.phone = payload.phone
    }

    if (Object.keys(profilePatch).length > 0) {
      profile = await updateUserProfile(supabase, user.id, profilePatch)
    }

    const settingsPatch: Record<string, unknown> = {}
    if (payload.preferredLanguage !== undefined) {
      settingsPatch.preferred_language = payload.preferredLanguage
    }
    if (payload.marketingOptIn !== undefined) {
      settingsPatch.marketing_opt_in = payload.marketingOptIn
    }
    if (payload.notificationsEmail !== undefined) {
      settingsPatch.notifications_email = payload.notificationsEmail
    }

    if (Object.keys(settingsPatch).length > 0) {
      settings = await updateUserSettings(supabase, user.id, settingsPatch)
    }

    return NextResponse.json(serializeResponse(user.email, profile, settings))
  } catch (error) {
    console.error('PUT /api/account/profile', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

function serializeResponse(
  email: string | undefined,
  profile: UserProfileRecord,
  settings: UserSettingsRecord
) {
  return {
    profile: {
      fullName: profile?.full_name ?? null,
      phone: profile?.phone ?? null,
      email: email ?? '',
    },
    settings: {
      preferredLanguage: settings?.preferred_language ?? null,
      marketingOptIn: Boolean(settings?.marketing_opt_in),
      notificationsEmail: settings?.notifications_email ?? true,
    },
  }
}

