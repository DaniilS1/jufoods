'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFavoritesStore } from '@/stores/favorites-store'
import { cn } from '@/lib/utils'
import { normalizeSupabaseImageUrl } from '@/lib/image-utils'

interface ProductCardProps {
  id: string
  slug: string
  name: string
  description: string
  imageUrl: string
  category: string
  defaultFlavourName?: string | null
}

export function ProductCard({
  id,
  slug,
  name,
  description,
  imageUrl,
  category,
  defaultFlavourName,
}: ProductCardProps) {
  const t = useTranslations('product')
  const [mounted, setMounted] = useState(false)
  const favoriteIds = useFavoritesStore((state) => state.favoriteIds)
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite)
  const favorite = mounted ? favoriteIds.includes(id) : false

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="group relative flex flex-col h-full overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0">
      {/* Image Container - Top Section */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted rounded-t-xl">
        <Link href={`/products/${slug}`} className="block h-full w-full">
          <Image
            src={normalizeSupabaseImageUrl(imageUrl)}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105 rounded-t-xl"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        </Link>

        {/* Heart Icon - Top Right */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-30 h-9 w-9 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-sm border border-border/50"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleFavorite(id)
            }}
          >
            <Heart
              className={cn('h-5 w-5 transition-all', favorite && 'fill-primary text-primary')}
            />
            <span className="sr-only">{favorite ? t('unfavorite') : t('favorite')}</span>
          </Button>
        )}
      </div>

      {/* Content Container - Bottom Section */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2">
          <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-primary/80">
            {category}
          </span>
        </div>

        <Link href={`/products/${slug}`} className="block">
          <h3 className="text-lg font-bold text-foreground leading-tight transition-colors  mb-2 line-clamp-1">
            {name}
          </h3>
        </Link>

        <div
          className={cn(
            // Keep card layout stable even if description contains multiple HTML blocks.
            'text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1',
            // Remove default spacing inside HTML content.
            '[&_p]:m-0 [&_p]:leading-relaxed [&_ul]:m-0 [&_ul]:pl-4 [&_li]:leading-relaxed'
          )}
          // Description comes from Supabase as HTML (e.g. <p>, <ul>).
          dangerouslySetInnerHTML={{ __html: description }}
        />

        {/* Optional Action / Bottom aligned content */}
        {defaultFlavourName && (
          <p className="mt-4 text-xs text-muted-foreground/60 italic">
            {defaultFlavourName}
          </p>
        )}
      </div>
    </div>
  )
}

