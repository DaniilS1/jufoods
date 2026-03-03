import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { insertCustomDesign, listCustomDesigns } from '@/lib/supabase/account'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 10 * 1024 * 1024

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const designs = await listCustomDesigns(supabase, user.id)

    return NextResponse.json({
      designs: designs.map((design) => ({
        id: design.id,
        imageUrl: design.image_url,
        notes: design.notes,
        createdAt: design.created_at,
      })),
    })
  } catch (error) {
    console.error('GET /api/account/designs', error)
    return NextResponse.json({ error: 'Failed to load designs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const notes = formData.get('notes')?.toString() ?? null

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File is too large (max 10MB)' }, { status: 400 })
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `custom-designs/${user.id}/${Date.now()}_${sanitizedName}`

    const { error: uploadError } = await supabase.storage.from('bilder').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (uploadError) {
      console.error('Custom design upload failed', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('bilder').getPublicUrl(filePath)

    const design = await insertCustomDesign(supabase, user.id, {
      image_url: publicUrl,
      notes,
    })

    return NextResponse.json({
      design: {
        id: design.id,
        imageUrl: design.image_url,
        notes: design.notes,
        createdAt: design.created_at,
      },
    })
  } catch (error) {
    console.error('POST /api/account/designs', error)
    return NextResponse.json({ error: 'Failed to upload design' }, { status: 500 })
  }
}



