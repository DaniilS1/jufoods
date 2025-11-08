/**
 * Normalizes Supabase Storage URLs to ensure they work with Next.js Image component
 * Converts signed URLs to public URLs if the bucket is public
 */
export function normalizeSupabaseImageUrl(url: string | null | undefined): string {
  if (!url) return '/placeholder-cake.svg'

  // If it's already a full public URL (with https://), return as is
  if (url.startsWith('http') && url.includes('/storage/v1/object/public/')) {
    return url
  }

  // If it's a relative public URL path, convert to full URL
  if (url.includes('/storage/v1/object/public/') && !url.startsWith('http')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      // Extract the path after /storage/v1/object/public/
      const pathMatch = url.match(/\/storage\/v1\/object\/public\/(.+)$/)
      if (pathMatch) {
        return `${supabaseUrl}/storage/v1/object/public/${pathMatch[1]}`
      }
    }
    return url
  }

  // If it's a signed URL, try to convert to public URL
  // This works if the bucket is public
  const signedUrlMatch = url.match(/\/storage\/v1\/object\/sign\/bilder\/(.+?)(\?|$)/)
  if (signedUrlMatch) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      const filePath = signedUrlMatch[1]
      return `${supabaseUrl}/storage/v1/object/public/bilder/${filePath}`
    }
  }

  // If it's just a filename or relative path in the bilder bucket
  if (!url.startsWith('http') && !url.startsWith('/')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      return `${supabaseUrl}/storage/v1/object/public/bilder/${url}`
    }
  }

  // If it's a relative path, return as is
  if (url.startsWith('/')) {
    return url
  }

  // Return original URL if we can't normalize it
  return url
}

