export type CatalogueGroup = 'torten' | 'desserts'

export type CatalogueSectionId =
  | 'feier'
  | 'hochzeit'
  | 'bento'
  | 'zum-tee'
  | 'klassische'
  | 'desserts'
  | 'cheesecakes'
  | 'macarons'
  | 'cookies'

export interface CatalogueSection {
  id: CatalogueSectionId
  group: CatalogueGroup
  dbCategory: string
  dbSubCategory?: string
  classic?: boolean
  labelKey: string
  accent: string
  descDe: string
  descUk: string
}

export const catalogueSections: CatalogueSection[] = [
  // ── Torten ─────────────────────────────────────────────────────
  {
    id: 'feier',
    group: 'torten',
    dbCategory: 'torten',
    dbSubCategory: 'feier',
    labelKey: 'feier',
    accent: '#C4907A',
    descDe: 'Geburtstag · Jubiläum · Taufe',
    descUk: 'День народження · Ювілей · Хрестини',
  },
  {
    id: 'hochzeit',
    group: 'torten',
    dbCategory: 'torten',
    dbSubCategory: 'hochzeit',
    labelKey: 'hochzeit',
    accent: '#D4B8A8',
    descDe: 'Zweistöckig · Blumen · Klassisch',
    descUk: 'Двоярусні · Квіти · Класика',
  },
  {
    id: 'bento',
    group: 'torten',
    dbCategory: 'torten',
    dbSubCategory: 'bento',
    labelKey: 'bento',
    accent: '#E8C4B8',
    descDe: 'Klein · Kreativ · Persönlich',
    descUk: 'Маленькі · Креативні · Особисті',
  },
  {
    id: 'zum-tee',
    group: 'torten',
    dbCategory: 'torten',
    dbSubCategory: 'zum-tee',
    labelKey: 'zum-tee',
    accent: '#C8A090',
    descDe: 'Rollkuchen · Törtchen · Petit Fours',
    descUk: 'Рулети · Тістечка · Petit Fours',
  },
  {
    id: 'klassische',
    group: 'torten',
    dbCategory: 'torten',
    classic: true,
    labelKey: 'klassische',
    accent: '#B89080',
    descDe: 'Medivnyk · Napoleon · Esterhazy',
    descUk: 'Медівник · Наполеон · Естерхазі',
  },

  // ── Desserts ────────────────────────────────────────────────────
  {
    id: 'desserts',
    group: 'desserts',
    dbCategory: 'desserts',
    labelKey: 'desserts',
    accent: '#8FB8A2',
    descDe: 'Zephyr · Pavlova · Rohkost',
    descUk: 'Зефір · Павлова · Сироїдіння',
  },
  {
    id: 'cheesecakes',
    group: 'desserts',
    dbCategory: 'cheesecakes',
    labelKey: 'cheesecakes',
    accent: '#A8C4B4',
    descDe: 'Gebacken · No-Bake · Frischkäse',
    descUk: 'Запечені · No-Bake · Вершковий сир',
  },
  {
    id: 'macarons',
    group: 'desserts',
    dbCategory: 'macarons',
    labelKey: 'macarons',
    accent: '#C4B8D4',
    descDe: '12 Sorten · Premium Füllung',
    descUk: '12 смаків · Преміум начинка',
  },
  {
    id: 'cookies',
    group: 'desserts',
    dbCategory: 'cookies',
    labelKey: 'cookies',
    accent: '#D4C4A8',
    descDe: 'Shortbread · Chocolate Chip · Nuss',
    descUk: 'Шортбред · Шоколадний · Горіховий',
  },
]

export const tortenSections = catalogueSections.filter((s) => s.group === 'torten')
export const dessertSections = catalogueSections.filter((s) => s.group === 'desserts')

export function getSectionById(id: string): CatalogueSection | undefined {
  return catalogueSections.find((s) => s.id === id)
}

export function getSectionForProduct(input: {
  category: string
  subCategory?: string | null
  classic?: boolean
}): CatalogueSection | undefined {
  if (input.category === 'torten') {
    if (input.classic) {
      return catalogueSections.find((s) => s.group === 'torten' && s.classic)
    }
    return catalogueSections.find((s) => s.group === 'torten' && s.dbSubCategory === input.subCategory)
  }
  return catalogueSections.find((s) => s.group === 'desserts' && s.dbCategory === input.category)
}
