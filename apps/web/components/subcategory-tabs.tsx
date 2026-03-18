'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { getSubcategoriesForCategory } from '@/lib/subcategory-config'
import { cn } from '@/lib/utils'
import { TorteBestellenModal } from '@/components/torte-bestellen-modal'
import { TortenViewToggle } from '@/components/torten-view-toggle'

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
  const searchParams = useSearchParams()
  const router = useRouter()
  const isProductPage = pathname?.includes('/products/')

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
      <div className="border-t border-primary/10 bg-white/50">
        <div className="container">
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1.5 -mx-4 px-4 overscroll-contain touch-manipulation sm:gap-2 sm:py-2">
            {showSubcategoryButtons && (
              <>
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
              </>
            )}

            {category === 'torten' && (
              <div className="ml-auto flex items-center gap-2 shrink-0">
                {!isProductPage && <TortenViewToggle currentView={currentView} />}
                <button
                  onClick={() => setModalOpen(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm touch-manipulation"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>{tModal('orderButton')}</span>
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>

      {category === 'torten' && (
        <button
          onClick={() => setModalOpen(true)}
          aria-label={tModal('orderButton')}
          className="fixed bottom-6 right-6 z-40 sm:hidden flex items-center justify-center size-11 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all touch-manipulation"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
        </button>
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

