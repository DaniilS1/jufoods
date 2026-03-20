'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { getSubcategoriesForCategory } from '@/lib/subcategory-config'
import { cn } from '@/lib/utils'
import { TorteBestellenModal } from '@/components/torte-bestellen-modal'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface SubcategoryTabsProps {
  category: string
  currentSubcategory: string | null
  locale: string
  currentView?: 'designs' | 'flavours'
}

export function SubcategoryTabs({ category, currentSubcategory, locale, currentView = 'designs' }: SubcategoryTabsProps) {
  const t = useTranslations('catalog')
  const tModal = useTranslations('torteModal')
  const pathname = usePathname()
  const router = useRouter()

  const [modalOpen, setModalOpen] = useState(false)

  const subcategories = getSubcategoriesForCategory(category)
  const showSubcategoryButtons = subcategories.length > 0 && currentView !== 'flavours'

  if (subcategories.length === 0 && category !== 'torten') {
    return null
  }

  function handleSubcategoryChange(subcategory: string | null) {
    const params = new URLSearchParams()
    
    if (subcategory) {
      params.set('subcategory', subcategory)
    }

    params.set('category', category)

    if (currentView === 'flavours') {
      params.set('view', 'flavours')
    }

    const isProductPage = pathname?.includes('/products/')
    const targetPath = isProductPage ? `/${locale}` : pathname || `/${locale}`
    
    router.push(`${targetPath}?${params.toString()}`)
  }

  return (
    <>
      {showSubcategoryButtons && (
        <div className="border-t border-primary/10 bg-white/50">
          <div className="container">
            <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1.5 -mx-4 px-4 overscroll-contain touch-manipulation sm:gap-2 sm:py-2">
              <button
                onClick={() => handleSubcategoryChange(null)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 sm:gap-2 sm:px-4 sm:text-sm',
                  !currentSubcategory
                    ? 'text-muted-foreground bg-primary/20'
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5 active:text-primary active:bg-primary/5'
                )}
              >
                <span>{t('all')}</span>
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
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 sm:gap-2 sm:px-4 sm:text-sm',
                      isActive
                        ? 'text-muted-foreground bg-primary/20'
                        : 'text-muted-foreground hover:text-primary hover:bg-primary/5 active:text-primary active:bg-primary/5'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                    <span>{t(translationKey)}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {category === 'torten' && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                aria-label={tModal('orderButton')}
                className={cn(
                  'fixed bottom-6 right-6 z-40 flex size-11 items-center justify-center rounded-full',
                  'bg-primary text-primary-foreground shadow-lg',
                  'hover:bg-primary/90 active:scale-95 transition-all touch-manipulation'
                )}
              >
                <Plus className="h-5 w-5 shrink-0" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" align="center">
              {tModal('orderButton')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {category === 'torten' && (
        <TorteBestellenModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          locale={locale}
          initialSubcategory={currentSubcategory}
        />
      )}
    </>
  )
}

