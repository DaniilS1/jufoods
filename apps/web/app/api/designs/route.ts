import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('torten_designs')
      .select('id, slug, name_uk, name_de, description_uk, description_de, sub_category, image_url')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ designs: data })
  } catch (error) {
    console.error('Error fetching designs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name_uk,
      name_de,
      description_uk = null,
      description_de = null,
      sub_category = null,
      image_url = null,
      slug,
    } = body

    if (!name_uk || !name_de) {
      return NextResponse.json({ error: 'Name (UK und DE) sind erforderlich' }, { status: 400 })
    }

    const supabase = await createClient()

    const designPayload = {
      slug: slug || slugify(name_de),
      name_uk,
      name_de,
      description_uk,
      description_de,
      sub_category: sub_category || null,
      image_url,
      category: 'torten' as const,
    }

    const { data: inserted, error } = await supabase
      .from('torten_designs')
      .insert(designPayload)
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ id: inserted?.id }, { status: 201 })
  } catch (error) {
    console.error('Error creating design:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      name_uk,
      name_de,
      description_uk = null,
      description_de = null,
      sub_category = null,
      image_url = null,
      slug,
    } = body

    if (!id || !name_uk || !name_de) {
      return NextResponse.json({ error: 'ID und Name (UK und DE) sind erforderlich' }, { status: 400 })
    }

    const supabase = await createClient()

    const { error: updateError } = await supabase
      .from('torten_designs')
      .update({
        slug: slug || slugify(name_de),
        name_uk,
        name_de,
        description_uk,
        description_de,
        sub_category: sub_category || null,
        image_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating design:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.from('torten_designs').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting design:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
