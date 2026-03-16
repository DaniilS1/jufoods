'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ChevronRight } from 'lucide-react'
import { ProductImageSlider } from './product-image-slider'
import { ProductDetailClient } from './product-detail-client'
import type { FlavorOption } from '@/types/product'

interface ProductDetailWrapperProps {
  product: {
    id: string
    slug: string
    name: string
    description: string
    imageUrl: string
    category: string
    subCategory?: string | null
    flavours: FlavorOption[]
    isTorten: boolean
    isClassic?: boolean
    imagesUrls?: string[]
  }
  locale: string
  categoryName: string
  children?: (selectedFlavor: FlavorOption | null) => React.ReactNode
}

export function ProductDetailWrapper({ product, locale, categoryName, children }: ProductDetailWrapperProps) {
  const initialFlavorId = useMemo(() => {
    if (!product.isTorten) return ''
    const defaultFlavor = product.flavours.find((flavor) => flavor.isDefault)
    return defaultFlavor?.id ?? product.flavours[0]?.id ?? ''
  }, [product.flavours, product.isTorten])

  const [selectedFlavorId, setSelectedFlavorId] = useState<string>(initialFlavorId)

  useEffect(() => {
    setSelectedFlavorId(initialFlavorId)
  }, [initialFlavorId])

  const selectedFlavor =
    product.isTorten && selectedFlavorId
      ? product.flavours.find((flavor) => flavor.id === selectedFlavorId) ?? product.flavours[0] ?? null
      : null

  const tNav = useTranslations('nav')

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-2">
      {/* Breadcrumbs - above image and details */}
      <nav
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link href={`/${locale}`} className="hover:text-primary transition-colors">
          {tNav('catalog')}
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        <Link
          href={`/${locale}?category=${product.category}`}
          className="hover:text-primary transition-colors"
        >
          {categoryName}
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        <span className="text-foreground truncate min-w-0">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start lg:gap-12">
      {/* Product Images */}
      <div className="w-full max-w-md lg:max-w-lg">
        <ProductImageSlider
          productImageUrl={product.imageUrl}
          productName={product.name}
          productId={product.id}
          additionalImages={product.imagesUrls}
        />
      </div>

      {/* Product Details */}
      <ProductDetailClient
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description,
          imageUrl: product.imageUrl,
          category: product.category,
          flavours: product.flavours,
          isTorten: product.isTorten,
          isClassic: product.isClassic,
        }}
        locale={locale}
        categoryName={categoryName}
        selectedFlavourId={product.isTorten ? selectedFlavorId : undefined}
        onFlavourChange={setSelectedFlavorId}
        selectedFlavour={selectedFlavor}
        showFlavourDetails={product.isTorten}
        showProductHeader
      />

      {/* Additional Content */}
      {typeof children === 'function' ? (
        <div className="lg:col-span-2 mt-8">{children(selectedFlavor)}</div>
      ) : null}
      </div>
    </div>
  )
}

