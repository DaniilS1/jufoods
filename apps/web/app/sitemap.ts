import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { locales } from '@/i18n'
import { catalogueSections } from '@/lib/catalogue-sections'
import { SITE_URL } from '@/lib/site-config'

const STATIC_PATHS = [
  '',
  '/catalog',
  '/torten',
  '/desserts',
  '/about',
  '/contact',
  '/products/custom',
  '/impressum',
  '/datenschutz',
  '/agb',
]

function localizedEntries(path: string, priority: number): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    lastModified: new Date(),
    priority,
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.flatMap((path) =>
    localizedEntries(path, path === '' ? 1 : 0.7)
  )

  for (const section of catalogueSections) {
    entries.push(...localizedEntries(`/catalog/${section.id}`, 0.6))
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (url && key) {
    const supabase = createClient(url, key)
    const [{ data: designs }, { data: products }] = await Promise.all([
      supabase.from('torten_designs').select('slug'),
      supabase.from('products').select('slug'),
    ])

    for (const slug of [...(designs ?? []), ...(products ?? [])]) {
      entries.push(...localizedEntries(`/products/${slug.slug}`, 0.5))
    }
  }

  return entries
}
