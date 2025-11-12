import {
  PieChart,
  Circle,
  Cookie,
  Cake,
  Candy,
  Layers,
  Building2,
  Sun,
  Sparkles,
  Heart,
  Coffee,
  PartyPopper,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface SubcategoryConfig {
  id: string
  icon: LucideIcon
  translationKey: string
}

export interface CategorySubcategories {
  [category: string]: SubcategoryConfig[]
}

export const subcategoryConfig: CategorySubcategories = {
  torten: [
    { id: 'hochzeit', icon: Heart, translationKey: 'hochzeit' },
    { id: 'zum-tee', icon: Coffee, translationKey: 'zum-tee' },
    { id: 'feier', icon: PartyPopper, translationKey: 'feier' },
  ],
  desserts: [
    { id: 'tarts', icon: PieChart, translationKey: 'tarts' },
    { id: 'cinabons', icon: Circle, translationKey: 'cinabons' },
    { id: 'куличи', icon: Cookie, translationKey: 'kulichi' },
    { id: 'капкейки', icon: Cake, translationKey: 'kapkeiky' },
    { id: 'кейпопы', icon: Candy, translationKey: 'cake-pops' },
    { id: 'муссовый', icon: Layers, translationKey: 'mousse' },
  ],
  cheesecakes: [
    { id: 'нью-йорк', icon: Building2, translationKey: 'new-york' },
    { id: 'сан себастьян', icon: Sun, translationKey: 'san-sebastian' },
    { id: 'чизкейк на палочке', icon: Sparkles, translationKey: 'cheesecake-on-a-stick' },
  ],
  cookies: [
    { id: 'шоколадні', icon: Cookie, translationKey: 'chocolate' },
    { id: 'блонді кукіс', icon: Circle, translationKey: 'blondie-cookies' },
  ],
}

export function getSubcategoriesForCategory(category: string): SubcategoryConfig[] {
  return subcategoryConfig[category] || []
}

export function hasSubcategories(category: string): boolean {
  return category in subcategoryConfig && subcategoryConfig[category].length > 0
}

