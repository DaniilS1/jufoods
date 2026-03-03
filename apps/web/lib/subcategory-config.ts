import type { LucideIcon } from 'lucide-react'
import { CakeSlice, Candy, Cookie, Croissant, Donut, IceCream, PartyPopper, Coffee, Lollipop } from 'lucide-react'

interface SubcategoryConfigEntry {
  id: string
  translationKey: string
  icon: LucideIcon
}

interface SubcategoryRegistry {
  [category: string]: ReadonlyArray<SubcategoryConfigEntry>
}

const SUBCATEGORY_REGISTRY: SubcategoryRegistry = {
  torten: [
    { id: 'hochzeit', translationKey: 'hochzeit', icon: PartyPopper },
    { id: 'zum-tee', translationKey: 'zum-tee', icon: Coffee },
    { id: 'feier', translationKey: 'feier', icon: CakeSlice },
  ],
  desserts: [
    { id: 'tarts', translationKey: 'tarts', icon: Donut },
    { id: 'cinabons', translationKey: 'cinabons', icon: Croissant },
    { id: 'kulichi', translationKey: 'kulichi', icon: CakeSlice },
    { id: 'kapkeiky', translationKey: 'kapkeiky', icon: Candy },
    { id: 'cake-pops', translationKey: 'cake-pops', icon: Lollipop },
    { id: 'mousse', translationKey: 'mousse', icon: IceCream },
  ],
  cheesecakes: [
    { id: 'new-york', translationKey: 'new-york', icon: CakeSlice },
    { id: 'san-sebastian', translationKey: 'san-sebastian', icon: PartyPopper },
    { id: 'cheesecake-on-a-stick', translationKey: 'cheesecake-on-a-stick', icon: Candy },
  ],
  cookies: [
    { id: 'chocolate', translationKey: 'chocolate', icon: Cookie },
    { id: 'blondie-cookies', translationKey: 'blondie-cookies', icon: Candy },
  ],
}

export function getSubcategoriesForCategory(category: string): ReadonlyArray<SubcategoryConfigEntry> {
  return SUBCATEGORY_REGISTRY[category] ?? []
}

export function hasSubcategories(category: string): boolean {
  return (SUBCATEGORY_REGISTRY[category]?.length ?? 0) > 0
}


