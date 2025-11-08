import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const productId = formData.get('productId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    const supabase = await createClient()

    // Sanitize filename
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\s+/g, '_')
    const fileName = `${Date.now()}_${sanitizedName}`
    const filePath = `custom-designs/${productId}/${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage.from('bilder').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('bilder').getPublicUrl(filePath)

    // Normalize URL (similar to admin-product-management.tsx)
    const publicUrlPattern = /\/storage\/v1\/object\/public\//
    let normalizedUrl = publicUrl
    if (publicUrlPattern.test(publicUrl)) {
      normalizedUrl = publicUrl
    } else {
      const signedUrlPattern = /\/storage\/v1\/object\/sign\/(.+?)\?/
      const match = publicUrl.match(signedUrlPattern)
      if (match) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        normalizedUrl = `${supabaseUrl}/storage/v1/object/public/bilder/${match[1].replace('bilder/', '')}`
      }
    }

    return NextResponse.json({ imageUrl: normalizedUrl }, { status: 200 })
  } catch (error) {
    console.error('Error uploading custom design:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

