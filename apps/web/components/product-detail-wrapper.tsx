'use client'

import { useState, useEffect, useMemo } from 'react'
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
  }
  locale: string
  children?: (selectedFlavor: FlavorOption | null) => React.ReactNode
}

export function ProductDetailWrapper({ product, locale, children }: ProductDetailWrapperProps) {
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

  return (
    <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-6 px-2 py-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start lg:gap-12">
      <div className="space-y-4">
        <ProductImageSlider productImageUrl={product.imageUrl} productName={product.name} productId={product.id} />
      </div>

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
        }}
        locale={locale}
        selectedFlavourId={product.isTorten ? selectedFlavorId : undefined}
        onFlavourChange={setSelectedFlavorId}
        selectedFlavour={selectedFlavor}
        showFlavourDetails={product.isTorten}
        showProductHeader
      />

      {typeof children === 'function' ? (
        <div className="lg:col-span-2">{children(selectedFlavor)}</div>
      ) : null}
    </div>
  )
}

