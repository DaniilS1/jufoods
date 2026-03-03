'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { normalizeSupabaseImageUrl } from '@/lib/image-utils'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  slug: string
  name_uk: string
  name_de: string
  description_uk: string | null
  description_de: string | null
  category: string
  image_url: string | null
  sub_category?: string | null
}

export function SearchBar() {
  const t = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Search products
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setResults([])
      setIsSearching(false)
      return
    }

    const searchProducts = async () => {
      setIsSearching(true)
      try {
        // Search in name and description fields (both languages)
        const query = searchQuery.trim().toLowerCase()

        const [tortenResponse, otherResponse] = await Promise.all([
          supabase
            .from('torten_designs')
            .select(
              `
                id,
                slug,
                name_uk,
                name_de,
                description_uk,
                description_de,
                category,
                sub_category,
                image_url,
                design_flavour (
                  design_id,
                  torten_flavours(name_uk, name_de, image_url)
                )
              `
            )
            .order('created_at', { ascending: false }),
          supabase
            .from('products')
            .select('id, slug, name_uk, name_de, description_uk, description_de, category, sub_category, image_url')
            .order('created_at', { ascending: false }),
        ])

        if (tortenResponse.error) throw tortenResponse.error
        if (otherResponse.error) throw otherResponse.error

        const tortenResults: SearchResult[] =
          tortenResponse.data?.map((design) => {
            const flavourLinks = design.design_flavour || []
            const sorted = flavourLinks
              .map((link) => {
                const flavourData = link.torten_flavours
                const flavour = Array.isArray(flavourData) ? flavourData[0] : flavourData

                if (!flavour) return null
                return {
                  isDefault: Boolean(link.is_default),
                  sortOrder: link.sort_order ?? Number.MAX_SAFE_INTEGER,
                  nameUk: flavour.name_uk,
                  nameDe: flavour.name_de,
                  imageUrl: flavour.image_url,
                }
              })
              .filter(Boolean) as Array<{ isDefault: boolean; sortOrder: number; nameUk?: string | null; nameDe?: string | null; imageUrl?: string | null }>

            const defaultFlavour = sorted.sort((a, b) => (a.isDefault ? -1 : b.isDefault ? 1 : a.sortOrder - b.sortOrder))[0] || null

            return {
              id: design.id,
              slug: design.slug,
              name_uk: design.name_uk,
              name_de: design.name_de,
              description_uk: design.description_uk,
              description_de: design.description_de,
              category: 'torten',
              sub_category: design.sub_category,
              image_url: defaultFlavour?.imageUrl || design.image_url,
            }
          }) || []

        const otherResults: SearchResult[] = otherResponse.data || []

        const combined = [...tortenResults, ...otherResults]

        const filtered = combined.filter((product) => {
          const nameUk = product.name_uk?.toLowerCase() || ''
          const nameDe = product.name_de?.toLowerCase() || ''
          const descUk = product.description_uk?.toLowerCase() || ''
          const descDe = product.description_de?.toLowerCase() || ''

          return (
            nameUk.includes(query) ||
            nameDe.includes(query) ||
            descUk.includes(query) ||
            descDe.includes(query)
          )
        })

        setResults(filtered.slice(0, 8)) // Limit to 8 results
        setShowResults(true)
      } catch (error) {
        console.error('Error searching products:', error)
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }

    // Debounce search
    const timeoutId = setTimeout(searchProducts, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, supabase])

  const handleResultClick = (slug: string) => {
    const localePrefix = pathname?.split('/')[1] || locale
    router.push(`/${localePrefix}/products/${slug}`)
    setSearchQuery('')
    setShowResults(false)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    setSearchQuery('')
    setResults([])
    setShowResults(false)
    inputRef.current?.focus()
  }

  const localePrefix = pathname?.split('/')[1] || locale

  return (
    <div ref={searchRef} className="relative">
      <div className="relative group">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground opacity-100" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={t('search') || 'Suchen...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
          className="pl-8 pr-8 w-50 h-8 rounded-md text-sm opacity-70 transition-all bg-primary/10 duration-100"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-70 hover:opacity-100 transition-opacity"
            onClick={handleClear}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (searchQuery.length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              {results.map((product) => {
                const name = locale === 'uk' ? product.name_uk : product.name_de
                const description = locale === 'uk' ? product.description_uk : product.description_de

                return (
                  <button
                    key={product.id}
                    onClick={() => handleResultClick(product.slug)}
                    className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors flex items-center gap-3"
                  >
                    {product.image_url && (
                      <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted shrink-0">
                        <Image
                          src={normalizeSupabaseImageUrl(product.image_url)}
                          alt={name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{name}</p>
                      {description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
                      )}
                      <span className="text-xs text-primary mt-1 inline-block">
                        {product.category}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : searchQuery.length >= 2 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">{t('noResults') || 'Keine Ergebnisse gefunden'}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

