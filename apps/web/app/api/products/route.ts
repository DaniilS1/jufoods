import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ products: data })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { slug, name_uk, name_de, description_uk, description_de, category, ingredients_uk, ingredients_de, allergens_uk, allergens_de, available_designs, image_url } = body

    if (!name_uk || !name_de || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Generate slug if not provided
    const finalSlug = slug || name_de
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const { data, error } = await supabase
      .from('products')
      .insert({
        slug: finalSlug,
        name_uk,
        name_de,
        description_uk: description_uk || null,
        description_de: description_de || null,
        category,
        ingredients_uk: ingredients_uk?.filter((i: string) => i.trim() !== '') || null,
        ingredients_de: ingredients_de?.filter((i: string) => i.trim() !== '') || null,
        allergens_uk: allergens_uk?.filter((a: string) => a.trim() !== '') || null,
        allergens_de: allergens_de?.filter((a: string) => a.trim() !== '') || null,
        available_designs: available_designs || [],
        image_url: image_url || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ product: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

