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
  /** DB category to query */
  dbCategory: string
  /** DB sub_category filter (undefined = no sub_category filter) */
  dbSubCategory?: string
  /** For torten designs: filter by classic=true */
  classic?: boolean
  /** i18n key: catalog.sections.{id} */
  labelKey: string
  /** Emoji or color hint for the card */
  accent: string
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
  },
  {
    id: 'hochzeit',
    group: 'torten',
    dbCategory: 'torten',
    dbSubCategory: 'hochzeit',
    labelKey: 'hochzeit',
    accent: '#D4B8A8',
  },
  {
    id: 'bento',
    group: 'torten',
    dbCategory: 'torten',
    dbSubCategory: 'bento',
    labelKey: 'bento',
    accent: '#E8C4B8',
  },
  {
    id: 'zum-tee',
    group: 'torten',
    dbCategory: 'torten',
    dbSubCategory: 'zum-tee',
    labelKey: 'zum-tee',
    accent: '#C8A090',
  },
  {
    id: 'klassische',
    group: 'torten',
    dbCategory: 'torten',
    classic: true,
    labelKey: 'klassische',
    accent: '#B89080',
  },

  // ── Desserts ────────────────────────────────────────────────────
  {
    id: 'desserts',
    group: 'desserts',
    dbCategory: 'desserts',
    labelKey: 'desserts',
    accent: '#8FB8A2',
  },
  {
    id: 'cheesecakes',
    group: 'desserts',
    dbCategory: 'cheesecakes',
    labelKey: 'cheesecakes',
    accent: '#A8C4B4',
  },
  {
    id: 'macarons',
    group: 'desserts',
    dbCategory: 'macarons',
    labelKey: 'macarons',
    accent: '#C4B8D4',
  },
  {
    id: 'cookies',
    group: 'desserts',
    dbCategory: 'cookies',
    labelKey: 'cookies',
    accent: '#D4C4A8',
  },
]

export const tortenSections = catalogueSections.filter((s) => s.group === 'torten')
export const dessertSections = catalogueSections.filter((s) => s.group === 'desserts')

export function getSectionById(id: string): CatalogueSection | undefined {
  return catalogueSections.find((s) => s.id === id)
}
