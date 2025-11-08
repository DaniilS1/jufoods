'use client'

import { useTranslations } from 'next-intl'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { getSubcategoriesForCategory } from '@/lib/subcategory-config'
import { cn } from '@/lib/utils'

interface SubcategoryTabsProps {
  category: string
  currentSubcategory: string | null
  locale: string
}

export function SubcategoryTabs({ category, currentSubcategory, locale }: SubcategoryTabsProps) {
  const t = useTranslations('catalog')
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const subcategories = getSubcategoriesForCategory(category)

  if (subcategories.length === 0) {
    return null
  }

  function handleSubcategoryChange(subcategory: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    
    if (subcategory) {
      params.set('subcategory', subcategory)
    } else {
      params.delete('subcategory')
    }

    // Ensure category is set
    params.set('category', category)

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="border-t border-primary/10 bg-white/50">
      <div className="container">
        <nav className="flex gap-2 overflow-x-auto scrollbar-hide py-2 -mx-4 px-4">
          <button
            onClick={() => handleSubcategoryChange(null)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 relative',
              !currentSubcategory
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
            )}
          >
            <span>{t('all')}</span>
            {!currentSubcategory && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
          {subcategories.map((subcategory) => {
            const Icon = subcategory.icon
            const translationKey = `subcategories.${category}.${subcategory.translationKey}`
            const isActive = currentSubcategory === subcategory.id
            
            return (
              <button
                key={subcategory.id}
                onClick={() => handleSubcategoryChange(subcategory.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 relative',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{t(translationKey)}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

