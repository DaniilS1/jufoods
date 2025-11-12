'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
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
  categoryName: string
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
  categoryName,
  selectedFlavourId: externalSelectedFlavourId,
  onFlavourChange: externalOnFlavourChange,
  selectedFlavour,
  showFlavourSelector = true,
  showFlavourDetails = true,
  showProductHeader = true,
}: ProductDetailClientProps) {
  const t = useTranslations('product')
  const tNav = useTranslations('nav')
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
        className="w-full rounded-full px-8 py-2 text-base font-semibold shadow-none transition-shadow"
        size="lg"
      >
        <ShoppingCart className="h-5 w-5 mr-2" />
        {t('addToCart')}
      </Button>
    </div>
  )

  return (
    <div className="sticky top-8 flex flex-col gap-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground -mb-2">
        <Link href={`/${locale}`} className="hover:text-primary transition-colors">
          {tNav('catalog')}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/${locale}?category=${product.category}`} className="hover:text-primary transition-colors">
          {categoryName}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      {/* Product Header */}
      {showProductHeader && (
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl tracking-tight">
              {product.name}
            </h1>
          </div>
          {product.description && (
            <p className="text-base text-muted-foreground leading-relaxed md:text-lg">
              {product.description}
            </p>
          )}
        </div>
      )}

      {/* Flavour Selector */}
      {shouldShowFlavourSelector && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">{t('selectFlavour')}</h2>
          <FlavourSelector
            flavours={product.flavours}
            selectedFlavourId={selectedFlavourId}
            onFlavourChange={setSelectedFlavourId}
          />
        </div>
      )}

      {/* Flavour Details or Action Buttons */}
      {showFlavourDetails && flavourDetails ? (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-2xl font-semibold text-foreground md:text-3xl">
              {flavourDetails.displayName}
            </h3>
            {flavourDetails.description && (
              <p className="text-base text-muted-foreground leading-relaxed">
                {flavourDetails.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2">{actionButtons}</div>

          {/* Product Information */}
          <div className="space-y-6 pt-4 border-t border-border/60">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t('ingredients')}
              </h4>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {flavourDetails.ingredients.join(', ')}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t('allergens')}
              </h4>
              <ul className="space-y-1.5 text-sm text-foreground/90">
                {flavourDetails.allergens.map((allergen) => (
                  <li key={allergen} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                    {allergen}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {locale === 'uk' ? 'Харчова цінність (на 100 г)' : t('nutritionPer100g')}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {flavourDetails.nutritionFacts.map((fact) => (
                  <div
                    key={`${fact.label}-${fact.value}`}
                    className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3"
                  >
                    <span className="text-xs font-medium text-muted-foreground">{fact.label}</span>
                    <span className="text-sm font-semibold text-foreground">{fact.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-4">{actionButtons}</div>
      )}
    </div>
  )
}

