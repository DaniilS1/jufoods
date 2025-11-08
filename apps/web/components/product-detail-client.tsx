'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { DesignSelector } from '@/components/design-selector'
import { useCartStore } from '@/stores/cart-store'
import { useUIStore } from '@/stores/ui-store'
import { useFavoritesStore } from '@/stores/favorites-store'
import { ShoppingBasketIcon, Heart, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Design {
  id: string
  name_uk: string
  name_de: string
  image: string
}

interface CustomDesign {
  id: string
  image: string
  text: string
}

interface ProductDetailClientProps {
  product: {
    id: string
    slug: string
    name: string
    description: string
    imageUrl?: string
    availableDesigns: Design[]
    category: string
  }
  locale: string
  selectedDesignId?: string
  onDesignChange?: (designId: string) => void
  customDesigns?: CustomDesign[]
  onCustomDesignUpload?: (customDesign: CustomDesign) => void
}

export function ProductDetailClient({
  product,
  locale,
  selectedDesignId: externalSelectedDesignId,
  onDesignChange: externalOnDesignChange,
  customDesigns = [],
  onCustomDesignUpload,
}: ProductDetailClientProps) {
  const t = useTranslations('product')
  const tCommon = useTranslations('common')
  const { addItem } = useCartStore()
  const { openCart } = useUIStore()
  const [mounted, setMounted] = useState(false)
  const isFavorite = useFavoritesStore((state) => state.isFavorite)
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite)
  const [internalSelectedDesignId, setInternalSelectedDesignId] = useState<string>(
    product.availableDesigns[0]?.id || ''
  )
  const favorite = mounted ? isFavorite(product.id) : false

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use external state if provided, otherwise use internal state
  const selectedDesignId = externalSelectedDesignId ?? internalSelectedDesignId
  const setSelectedDesignId = externalOnDesignChange ?? setInternalSelectedDesignId

  const handleAddToCart = () => {
    // Only require design selection for torten (cakes)
    if (product.category === 'torten') {
      if (!selectedDesignId) {
        alert(t('noDesignSelected'))
        return
      }

      // Check if it's a custom design
      const isCustomDesign = selectedDesignId.startsWith('custom-')
      let designName = ''
      let designImageUrl = ''

      if (isCustomDesign) {
        const customDesign = customDesigns.find((d) => d.id === selectedDesignId)
        designName = customDesign
          ? t('customDesign') + (customDesign.text ? `: ${customDesign.text}` : '')
          : t('customDesign')
        designImageUrl = customDesign?.image || ''
      } else {
        const selectedDesign = product.availableDesigns.find((d) => d.id === selectedDesignId)
        if (!selectedDesign) return
        designName = locale === 'uk' ? selectedDesign.name_uk : selectedDesign.name_de
        designImageUrl = selectedDesign.image || ''
      }

      addItem({
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        productImageUrl: product.imageUrl,
        designId: selectedDesignId,
        designName: designName,
        designImageUrl: designImageUrl,
      })
    } else {
      // For other categories, no design is needed
      addItem({
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        productImageUrl: product.imageUrl,
        designId: '',
        designName: '',
        designImageUrl: '',
      })
    }

    openCart()
  }

  const handleFavoriteClick = () => {
    if (mounted) {
      toggleFavorite(product.id)
    }
  }

  // Only show design selector for torten (cakes)
  const showDesignSelector = product.category === 'torten' && (product.availableDesigns.length > 0 || customDesigns.length > 0)

  return (
    <div className="space-y-4">
      {showDesignSelector && (
        <DesignSelector
          designs={product.availableDesigns}
          customDesigns={customDesigns}
          selectedDesignId={selectedDesignId}
          onDesignChange={setSelectedDesignId}
          locale={locale}
          productId={product.id}
          onCustomDesignUpload={onCustomDesignUpload}
        />
      )}

      <div className={showDesignSelector ? "pt-3 border-0 mx-auto" : "mx-auto"}>
        <div className="flex items-center gap-3">
          <Button onClick={handleAddToCart} className="w-fit" size="lg">
            <ShoppingCart className="h-4 w-4 mr-2" />{t('addToCart')}
          </Button>
          
        </div>
      </div>
    </div>
  )
}

