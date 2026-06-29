'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ChevronRight } from 'lucide-react'
import { CustomTorteUploader } from './custom-torte-uploader'
import { ProductDetailClient } from './product-detail-client'
import type { FlavorOption } from '@/types/product'

interface CustomTorteWrapperProps {
  flavours: FlavorOption[]
  locale: string
  categoryName: string
}

export function CustomTorteWrapper({ flavours, locale, categoryName }: CustomTorteWrapperProps) {
  const t = useTranslations('customTorte')
  const tNav = useTranslations('nav')

  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [designNote, setDesignNote] = useState('')

  const initialFlavorId = useMemo(() => {
    const defaultFlavor = flavours.find((flavor) => flavor.isDefault)
    return defaultFlavor?.id ?? flavours[0]?.id ?? ''
  }, [flavours])

  const [selectedFlavorId, setSelectedFlavorId] = useState<string>(initialFlavorId)

  useEffect(() => {
    setSelectedFlavorId(initialFlavorId)
  }, [initialFlavorId])

  const selectedFlavor = selectedFlavorId
    ? flavours.find((flavor) => flavor.id === selectedFlavorId) ?? flavours[0] ?? null
    : null

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-2">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href={`/${locale}`} className="hover:text-primary transition-colors">
          {tNav('catalog')}
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        <Link href={`/${locale}/torten`} className="hover:text-primary transition-colors">
          {categoryName}
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        <span className="text-foreground truncate min-w-0">{t('pageTitle')}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start lg:gap-12">
        {/* Upload zone (replaces image slider) */}
        <div className="w-full max-w-md lg:max-w-lg">
          <CustomTorteUploader
            locale={locale}
            value={imageUrls}
            note={designNote}
            onChange={setImageUrls}
            onNoteChange={setDesignNote}
            max={5}
          />
        </div>

        {/* Product details */}
        <ProductDetailClient
          product={{
            id: 'custom',
            slug: 'custom',
            name: t('pageTitle'),
            description: t('pageSubtitle'),
            category: 'torten',
            flavours,
            isTorten: true,
            isClassic: false,
          }}
          locale={locale}
          categoryName={categoryName}
          selectedFlavourId={selectedFlavorId}
          onFlavourChange={setSelectedFlavorId}
          selectedFlavour={selectedFlavor}
          showFlavourDetails
          showProductHeader
          isCustom
          customImageUrls={imageUrls}
          customDesignNote={designNote}
        />
      </div>
    </div>
  )
}
