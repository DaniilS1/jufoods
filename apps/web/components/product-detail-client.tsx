'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/stores/cart-store'
import { useUIStore } from '@/stores/ui-store'
import { ShoppingCart } from 'lucide-react'
import { FlavourSelector } from '@/components/flavour-selector'
import type { FlavorOption } from '@/types/product'

interface ProductDetailClientProps {
  product: {
    id: string
    slug: string
    name: string
    description: string
    imageUrl?: string
    category: string
    flavours: FlavorOption[]
    isTorten: boolean
  }
  locale: string
  selectedFlavourId?: string
  onFlavourChange?: (flavourId: string) => void
  selectedFlavour?: FlavorOption | null
  showFlavourSelector?: boolean
  showFlavourDetails?: boolean
  showProductHeader?: boolean
}

export function ProductDetailClient({
  product,
  locale,
  selectedFlavourId: externalSelectedFlavourId,
  onFlavourChange: externalOnFlavourChange,
  selectedFlavour,
  showFlavourSelector = true,
  showFlavourDetails = true,
  showProductHeader = true,
}: ProductDetailClientProps) {
  const t = useTranslations('product')
  const { addItem } = useCartStore()
  const { openCart } = useUIStore()
  const [internalSelectedFlavourId, setInternalSelectedFlavourId] = useState<string>(
    product.isTorten ? product.flavours[0]?.id || '' : ''
  )

  useEffect(() => {
    if (product.isTorten) {
      const defaultFlavour =
        product.flavours.find((flavour) => flavour.isDefault) ?? product.flavours[0]
      setInternalSelectedFlavourId(defaultFlavour?.id || '')
    }
  }, [product.flavours, product.isTorten])

  const selectedFlavourId = externalSelectedFlavourId ?? internalSelectedFlavourId
  const setSelectedFlavourId = externalOnFlavourChange ?? setInternalSelectedFlavourId

  const handleAddToCart = () => {
    if (product.isTorten) {
      if (!selectedFlavourId) {
        alert(t('noFlavourSelected'))
        return
      }

      const flavour =
        selectedFlavour ??
        product.flavours.find((flavour) => flavour.id === selectedFlavourId) ??
        null
      if (!flavour) {
        alert(t('noFlavourSelected'))
        return
      }

      addItem({
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        productImageUrl: product.imageUrl,
        designId: flavour.id,
        designName: flavour.displayName,
        designImageUrl: flavour.imageUrl,
      })
    } else {
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

  const shouldShowFlavourSelector = showFlavourSelector && product.isTorten && product.flavours.length > 0
  const flavourDetails =
    selectedFlavour ??
    (selectedFlavourId ? product.flavours.find((flavour) => flavour.id === selectedFlavourId) : null)

  const actionButtons = (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        onClick={handleAddToCart}
        className="rounded-full px-6 py-2 text-sm font-semibold shadow-sm"
        size="default"
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        {t('addToCart')}
      </Button>
    </div>
  )

  return (
    <div className="relative flex flex-col gap-5 rounded-3xl border border-border/60 bg-card/85 p-6 shadow-sm backdrop-blur-sm">
      {showProductHeader && (
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">{product.name}</h1>
          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed md:text-base">{product.description}</p>
          )}
        </div>
      )}

      {shouldShowFlavourSelector && (
        <FlavourSelector
          flavours={product.flavours}
          selectedFlavourId={selectedFlavourId}
          onFlavourChange={setSelectedFlavourId}
        />
      )}

      {showFlavourDetails && flavourDetails ? (
        <div className="space-y-5">
          <div>
            <h3 className="text-xl font-semibold text-foreground md:text-2xl">{flavourDetails.displayName}</h3>
            {flavourDetails.description && (
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed md:text-base">
                {flavourDetails.description}
              </p>
            )}
          </div>

          {actionButtons}

          <div className="space-y-5">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t('ingredients')}
              </h4>
              <p className="text-sm text-foreground/80 leading-relaxed md:text-base">
                {flavourDetails.ingredients.join(', ')}
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t('allergens')}
              </h4>
              <ul className="space-y-1 text-sm text-foreground/80 leading-relaxed md:text-base">
                {flavourDetails.allergens.map((allergen) => (
                  <li key={allergen}>{allergen}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {locale === 'uk' ? 'Харчова цінність (на 100 г)' : t('nutritionPer100g')}
              </h4>
              <ul className="space-y-1 text-sm text-foreground/80 md:text-base">
                {flavourDetails.nutritionFacts.map((fact) => (
                  <li key={`${fact.label}-${fact.value}`}>
                    <span className="font-medium text-foreground">{fact.label}:</span> {fact.value}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        actionButtons
      )}
    </div>
  )
}

