import { createClient } from '@/lib/supabase/server'
import type { Locale } from '@/i18n'
import { PopularTortenCarousel, type PopularTorte } from '@/components/popular-torten-carousel'

interface PopularTortenProps {
  locale: Locale
}

export async function PopularTorten({ locale }: PopularTortenProps) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('torten_designs')
    .select('id, slug, name_uk, name_de, description_uk, description_de, image_url, popularity_rank')
    .not('popularity_rank', 'is', null)
    .order('popularity_rank', { ascending: true })
    .limit(6)

  if (error || !data || data.length === 0) {
    return null
  }

  const items: PopularTorte[] = data.map((d) => ({
    id: d.id,
    slug: d.slug,
    name: locale === 'uk' ? d.name_uk : d.name_de,
    description: (locale === 'uk' ? d.description_uk : d.description_de) ?? '',
    imageUrl: d.image_url ?? '',
  }))

  return <PopularTortenCarousel items={items} locale={locale} />
}
