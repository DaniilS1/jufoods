import { getTranslations } from 'next-intl/server'
import { CustomTorteWrapper } from '@/components/custom-torte-wrapper'
import { createClient } from '@/lib/supabase/server'
import { mapFlavourToOption, type TortenFlavourRecord } from '@/lib/flavours'
import type { FlavorOption } from '@/types/product'

export default async function CustomTortePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const tNav = await getTranslations('nav')

  const supabase = await createClient()

  const { data: flavourRows } = await supabase
    .from('torten_flavours')
    .select(
      'id, slug, name_de, name_uk, description_de, description_uk, ingredients_de, ingredients_uk, allergens_de, allergens_uk, nutrition, image_url'
    )
    .order('flavour_number', { ascending: true })

  const flavours: FlavorOption[] = (flavourRows ?? []).map((flavour, index) =>
    mapFlavourToOption(flavour as TortenFlavourRecord, locale, { isDefault: index === 0 })
  )

  const categoryName = locale === 'uk' ? 'Торти' : tNav('cakes')

  return (
    <div className="container py-6">
      <CustomTorteWrapper flavours={flavours} locale={locale} categoryName={categoryName} />
    </div>
  )
}
