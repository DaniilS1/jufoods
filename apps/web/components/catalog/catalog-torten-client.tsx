'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { CatalogDesignCard } from './catalog-design-card'
import { TorteBestellenModal } from '@/components/torte-bestellen-modal'

interface ProductItem {
  id: string
  slug: string
  name: string
  description: string
  imageUrl: string
}

interface CatalogTortenClientProps {
  products: ProductItem[]
  locale: string
  subcategory?: string | null
}

export function CatalogTortenClient({ products, locale, subcategory }: CatalogTortenClientProps) {
  const t = useTranslations('catalog')
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
        {products.map((p) => (
          <CatalogDesignCard
            key={p.id}
            {...p}
            locale={locale}
            onOrder={() => setModalOpen(true)}
          />
        ))}
      </div>

      {/* Mobile FAB */}
      <button
        className="fixed bottom-6 right-4 z-40 md:hidden flex items-center justify-center w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
        onClick={() => setModalOpen(true)}
        aria-label={t('orderCta')}
      >
        <Plus className="h-5 w-5" />
      </button>

      <TorteBestellenModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        locale={locale}
        initialSubcategory={subcategory}
      />
    </>
  )
}
