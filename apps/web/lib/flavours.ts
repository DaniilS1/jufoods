import type { FlavorOption, NutritionFact } from '@/types/product'

export interface TortenFlavourRecord {
  id: string
  slug: string
  name_de: string
  name_uk: string
  description_de: string | null
  description_uk: string | null
  ingredients_de: string[] | null
  ingredients_uk: string[] | null
  allergens_de: string[] | null
  allergens_uk: string[] | null
  nutrition: Record<string, unknown> | null
  image_url: string | null
}

export const FALLBACK_INGREDIENTS_UK: string[] = [
  'вершковий сир',
  'вершки 30%',
  'курячі яйця',
  'пшеничне борошно',
  'цукор',
  'вершкове масло',
  'білий шоколад (молоко, соєвий лецитин)',
  'ягідне пюре',
  'темний шоколад (соєвий лецитин)',
  'рослинна олія',
  'молоко',
  'лимонний сік',
  'кукурудзяний крохмаль',
  'какао-масло',
  'мак',
  'лимонна цедра',
  'желатин',
  'розпушувач',
  'сіль',
  'ванільний цукор',
  'пектин NH',
  'натуральні ароматизатори',
  'жиророзчинний барвник',
]

export const FALLBACK_INGREDIENTS_DE: string[] = [
  'Frischkäse',
  'Sahne 30%',
  'Hühnereier',
  'Weizenmehl',
  'Zucker',
  'Butter',
  'Weiße Schokolade (Milch, Sojalecithin)',
  'Beerenpüree',
  'Zartbitterschokolade (Sojalecithin)',
  'Pflanzenöl',
  'Milch',
  'Zitronensaft',
  'Maisstärke',
  'Kakaobutter',
  'Mohn',
  'Zitronenschale',
  'Gelatine',
  'Backtriebmittel',
  'Salz',
  'Vanillezucker',
  'Pektin NH',
  'Natürliche Aromen',
  'Fettlöslicher Farbstoff',
]

export const FALLBACK_ALLERGENS_UK: string[] = ['молоко', 'яйця', 'пшеничне борошно', 'соєвий лецитин']
export const FALLBACK_ALLERGENS_DE: string[] = ['Milch', 'Eier', 'Weizenmehl', 'Sojalecithin']

export const FALLBACK_NUTRITION_FACTS: Record<'uk' | 'de', NutritionFact[]> = {
  uk: [
    { label: 'Енергетична цінність', value: '371,6 ккал (≈1555 кДж)' },
    { label: 'Білки', value: '3,6 г' },
    { label: 'Жири', value: '26,8 г' },
    { label: 'Вуглеводи', value: '28,9 г' },
  ],
  de: [
    { label: 'Energie', value: '371,6 kcal (≈1555 kJ)' },
    { label: 'Eiweiß', value: '3,6 g' },
    { label: 'Fett', value: '26,8 g' },
    { label: 'Kohlenhydrate', value: '28,9 g' },
  ],
}

/**
 * Maps a torten_flavours DB record into the FlavorOption shape used by the
 * product detail UI. Applies locale-aware fields and sensible fallbacks for
 * ingredients, allergens and nutrition.
 */
export function mapFlavourToOption(
  flavour: TortenFlavourRecord,
  locale: string,
  options?: { isDefault?: boolean; fallbackImageUrl?: string | null }
): FlavorOption {
  const displayName = locale === 'uk' ? flavour.name_uk : flavour.name_de
  const description = (locale === 'uk' ? flavour.description_uk : flavour.description_de) || ''
  const ingredients =
    locale === 'uk'
      ? flavour.ingredients_uk || FALLBACK_INGREDIENTS_UK
      : flavour.ingredients_de || FALLBACK_INGREDIENTS_DE
  const allergens =
    locale === 'uk'
      ? flavour.allergens_uk || FALLBACK_ALLERGENS_UK
      : flavour.allergens_de || FALLBACK_ALLERGENS_DE

  const nutritionRaw = flavour.nutrition as Record<string, unknown> | null
  const localeKey = locale === 'uk' ? 'text_uk' : 'text_de'
  const legacyText =
    nutritionRaw && typeof nutritionRaw.text === 'string' ? (nutritionRaw.text as string).trim() : ''
  const localeText =
    nutritionRaw && typeof nutritionRaw[localeKey] === 'string'
      ? (nutritionRaw[localeKey] as string).trim()
      : legacyText
  const nutritionText = localeText !== '' ? localeText : undefined
  const nutritionFacts: NutritionFact[] =
    nutritionText !== undefined
      ? []
      : nutritionRaw && Object.keys(nutritionRaw).length > 0
        ? Object.entries(nutritionRaw)
            .filter(([key]) => key !== 'text' && key !== 'text_de' && key !== 'text_uk')
            .map(([label, value]) => ({ label, value: String(value) }))
        : FALLBACK_NUTRITION_FACTS[locale as 'uk' | 'de']

  return {
    id: flavour.id,
    slug: flavour.slug,
    displayName,
    description,
    imageUrl: flavour.image_url || options?.fallbackImageUrl || '/placeholder-cake.svg',
    ingredients,
    allergens,
    nutritionFacts,
    nutritionText,
    priceDelta: null,
    isDefault: options?.isDefault ?? false,
  }
}
