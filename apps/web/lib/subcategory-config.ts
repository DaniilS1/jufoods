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
    { id: 'куличи', icon: Cookie, translationKey: 'куличи' },
    { id: 'капкейки', icon: Cake, translationKey: 'капкейки' },
    { id: 'кейпопы', icon: Candy, translationKey: 'кейпопы' },
    { id: 'муссовый', icon: Layers, translationKey: 'муссовый' },
  ],
  cheesecakes: [
    { id: 'нью-йорк', icon: Building2, translationKey: 'нью-йорк' },
    { id: 'сан себастьян', icon: Sun, translationKey: 'сан себастьян' },
    { id: 'чизкейк на палочке', icon: Sparkles, translationKey: 'чизкейк на палочке' },
  ],
  cookies: [
    { id: 'шоколадні', icon: Cookie, translationKey: 'шоколадні' },
    { id: 'блонді кукіс', icon: Circle, translationKey: 'блонді кукіс' },
  ],
}

export function getSubcategoriesForCategory(category: string): SubcategoryConfig[] {
  return subcategoryConfig[category] || []
}

export function hasSubcategories(category: string): boolean {
  return category in subcategoryConfig && subcategoryConfig[category].length > 0
}

