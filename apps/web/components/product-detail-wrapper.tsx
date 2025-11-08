'use client'

import { useState, useEffect } from 'react'
import { ProductImageSlider } from './product-image-slider'
import { ProductDetailClient } from './product-detail-client'

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

interface ProductDetailWrapperProps {
  product: {
    id: string
    slug: string
    name: string
    description: string
    imageUrl: string
    availableDesigns: Design[]
    category: string
  }
  locale: string
  children?: React.ReactNode
}

export function ProductDetailWrapper({
  product,
  locale,
  children,
}: ProductDetailWrapperProps) {
  // Only initialize design selection for torten (cakes)
  const [selectedDesignId, setSelectedDesignId] = useState<string>(
    product.category === 'torten' ? (product.availableDesigns[0]?.id || '') : ''
  )
  const [customDesigns, setCustomDesigns] = useState<CustomDesign[]>([])

  // Load custom designs from localStorage
  useEffect(() => {
    if (product.category === 'torten') {
      const storageKey = `custom-designs-${product.id}`
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        try {
          const designs = JSON.parse(stored)
          setCustomDesigns(designs)
        } catch (error) {
          console.error('Error loading custom designs:', error)
        }
      }
    }
  }, [product.id, product.category])

  const handleCustomDesignUpload = (customDesign: CustomDesign) => {
    setCustomDesigns((prev) => [...prev, customDesign])
    // Auto-select the newly uploaded design
    setSelectedDesignId(customDesign.id)
  }

  // Merge standard designs with custom designs for image slider
  const allDesignsForSlider = [
    ...product.availableDesigns,
    ...customDesigns.map((custom) => ({
      id: custom.id,
      name_uk: 'Custom',
      name_de: 'Custom',
      image: custom.image,
    })),
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-2">
      {/* Product Image Slider */}
      <ProductImageSlider
        productImageUrl={product.imageUrl}
        productName={product.name}
        availableDesigns={product.category === 'torten' ? allDesignsForSlider : []}
        selectedDesignId={product.category === 'torten' ? selectedDesignId : undefined}
        locale={locale}
        productId={product.id}
      />

      {/* Product Info */}
      <div className="space-y-4">
        {/* Product Name */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">{product.name}</h1>
          {product.description && (
            <p className="text-base text-muted-foreground leading-relaxed">{product.description}</p>
          )}
        </div>

        {/* Design Selector & Add to Cart */}
        <ProductDetailClient
          product={{
            id: product.id,
            slug: product.slug,
            name: product.name,
            description: product.description,
            imageUrl: product.imageUrl,
            availableDesigns: product.availableDesigns,
            category: product.category,
          }}
          locale={locale}
          selectedDesignId={selectedDesignId}
          onDesignChange={setSelectedDesignId}
          customDesigns={customDesigns}
          onCustomDesignUpload={handleCustomDesignUpload}
        />

        {children}
      </div>
    </div>
  )
}

