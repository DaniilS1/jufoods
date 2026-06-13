'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { ShoppingCart, Calendar as CalendarIcon, ChevronRight, Users, UtensilsCrossed, Info } from 'lucide-react'
import { format } from 'date-fns'
import { de, uk } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCartStore } from '@/stores/cart-store'
import { useUIStore } from '@/stores/ui-store'
import { FlavourSelector, type FlavourShowAllApi } from '@/components/flavour-selector'
import { cn } from '@/lib/utils'
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
    isClassic?: boolean
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

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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
  const tCatalog = useTranslations('catalog')
  const { addItem } = useCartStore()
  const { openCart } = useUIStore()
  const [internalSelectedFlavourId, setInternalSelectedFlavourId] = useState<string>(
    product.isTorten ? product.flavours[0]?.id || '' : ''
  )
  const [deliveryDate, setDeliveryDate] = useState<string>('')
  const [personCount, setPersonCount] = useState<string>('')
  const [flavourShowAllApi, setFlavourShowAllApi] = useState<FlavourShowAllApi | null>(null)

  useEffect(() => {
    if (product.isTorten) {
      const defaultFlavour =
        product.flavours.find((flavour) => flavour.isDefault) ?? product.flavours[0]
      setInternalSelectedFlavourId(defaultFlavour?.id || '')
    }
  }, [product.flavours, product.isTorten])

  const selectedFlavourId = externalSelectedFlavourId ?? internalSelectedFlavourId
  const setSelectedFlavourId = externalOnFlavourChange ?? setInternalSelectedFlavourId

  const dateFnsLocale = locale === 'uk' ? uk : de
  const minDate = new Date(new Date().setHours(0, 0, 0, 0))

  const handleAddToCart = useCallback(() => {
    if (product.isTorten) {
      if (!selectedFlavourId) {
        return
      }

      const flavour =
        selectedFlavour ??
        product.flavours.find((f) => f.id === selectedFlavourId) ??
        null
      if (!flavour) return

      const parsedCount = parseInt(personCount, 10)
      const validCount = !Number.isNaN(parsedCount) && parsedCount >= 1 ? parsedCount : undefined
      if (!deliveryDate || !validCount) return

      addItem({
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        productImageUrl: product.imageUrl,
        designId: flavour.id,
        designName: flavour.displayName,
        designImageUrl: flavour.imageUrl,
        personCount: validCount,
        deliveryDate,
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
  }, [
    product,
    selectedFlavourId,
    selectedFlavour,
    deliveryDate,
    personCount,
    addItem,
    openCart,
  ])

  const shouldShowFlavourSelector = showFlavourSelector && product.isTorten && product.flavours.length > 0
  const flavourDetails =
    selectedFlavour ??
    (selectedFlavourId ? product.flavours.find((f) => f.id === selectedFlavourId) : null)

  const parsedCount = parseInt(personCount, 10)
  const isValidCount = !Number.isNaN(parsedCount) && parsedCount >= 1
  const canAddTorte = !!selectedFlavourId && !!deliveryDate && isValidCount
  const canAddNonTorte = !product.isTorten
  const canAddToCart = product.isTorten ? canAddTorte : canAddNonTorte

  return (
    <div className="flex flex-col gap-8 lg:sticky lg:top-8">
      {/* Product Header */}
      {showProductHeader && (
        <section className="space-y-3" aria-labelledby="product-title">
          {categoryName && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              {categoryName}
            </p>
          )}
          <h1
            id="product-title"
            className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl lg:text-4xl text-balance"
          >
            {product.name}
          </h1>
          {product.description && (
            <div
              className="prose prose-sm max-w-none text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}
        </section>
      )}

      {/* Flavour Selector + Details */}
      {shouldShowFlavourSelector && (
        <section className="space-y-4" aria-labelledby="flavour-heading">

          {((showFlavourDetails && flavourDetails) || flavourShowAllApi?.active) && (
            <div className="flex flex-col gap-2">
              <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-2">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  {showFlavourDetails && flavourDetails && (
                    <>
                      <Badge variant="default" className="text-sm bg-primary rounded-full font-normal px-2 py-0.5 flex items-center gap-1.5">
                        <UtensilsCrossed className="size-3.5 shrink-0" aria-hidden />
                        {flavourDetails.displayName}
                      </Badge>

                      {isValidCount && (
                        <Badge variant="default" className="text-sm bg-primary rounded-full font-normal px-2 py-0.5 flex items-center gap-1.5">
                          <Users className="size-3.5 shrink-0" aria-hidden />
                          {personCount}
                        </Badge>
                      )}
                      {deliveryDate && (
                        <Badge variant="default" className="text-sm bg-primary rounded-full font-normal px-2 py-0.5 flex items-center gap-1.5">
                          <CalendarIcon className="size-3.5 shrink-0" aria-hidden />
                          {format(parseLocalDate(deliveryDate), 'PPP', { locale: dateFnsLocale })}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                {flavourShowAllApi?.active && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-auto h-auto rounded-full text-sm font-normal px-2.5 py-0.5 gap-1 shrink-0 touch-manipulation"
                    onClick={() => flavourShowAllApi.open()}
                  >
                    {tCatalog('all')}
                    <ChevronRight className="size-3.5 shrink-0" aria-hidden />
                  </Button>
                )}
              </div>
            </div>
          )}
          {!product.isClassic && (
            <FlavourSelector
              flavours={product.flavours}
              selectedFlavourId={selectedFlavourId}
              onFlavourChange={setSelectedFlavourId}
              onShowAllApi={setFlavourShowAllApi}
            />
          )}
          {flavourDetails?.description && (
            <div
              className="prose prose-sm max-w-none text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
              dangerouslySetInnerHTML={{ __html: flavourDetails.description }}
            />
          )}
        </section>
      )}

      {/* Order Options (Torten only): Delivery Date & Person Count */}
      {product.isTorten && (
        <section
          className="space-y-4 rounded-xl border-none border-border/60 p-0"
          aria-labelledby="order-options-heading"
        >

          {/* Person count presets */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <Users className="h-4 w-4 shrink-0 text-primary/70" aria-hidden />
              {t('personCount')} <span className="text-destructive" aria-hidden>*</span>
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {([['2to4', 3], ['6to8', 7], ['10to12', 11], ['12plus', 13]] as const).map(([key, val]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPersonCount(String(val))}
                  className={cn(
                    'py-2 rounded-lg border text-xs font-medium transition-colors touch-manipulation',
                    personCount === String(val)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  )}
                >
                  {t(`personLabels.${key}` as Parameters<typeof t>[0])}
                </button>
              ))}
            </div>
            <Input
              id="person-count"
              type="number"
              inputMode="numeric"
              min={1}
              max={500}
              value={personCount}
              onChange={(e) => setPersonCount(e.target.value)}
              placeholder={t('personCountPlaceholder')}
              className="min-h-[44px]"
              aria-required
              aria-invalid={personCount !== '' && !isValidCount}
              aria-describedby={personCount !== '' && !isValidCount ? 'person-count-error' : undefined}
            />
            {personCount !== '' && !isValidCount && (
              <p id="person-count-error" className="text-sm text-destructive" role="alert">
                {locale === 'uk' ? 'Мінімум 1 особа' : 'Mindestens 1 Person'}
              </p>
            )}
          </div>

          <div className="space-y-2">
              <Label htmlFor="delivery-date" className="flex items-center gap-1.5 text-sm font-medium">
                <CalendarIcon className="h-4 w-4 shrink-0 text-primary/70" aria-hidden />
                {t('deliveryDate')} <span className="text-destructive" aria-hidden>*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="delivery-date"
                    variant="outline"
                    className={cn(
                      'w-full min-h-[44px] justify-start text-left font-normal touch-manipulation rounded-lg',
                      !deliveryDate && 'text-muted-foreground'
                    )}
                    aria-haspopup="dialog"
                    aria-expanded={undefined}
                    aria-label={
                      deliveryDate
                        ? `${t('deliveryDate')}: ${format(parseLocalDate(deliveryDate), 'PPP', {
                            locale: dateFnsLocale,
                          })}`
                        : t('selectDeliveryDate')
                    }
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                    {deliveryDate ? (
                      format(parseLocalDate(deliveryDate), 'PPP', { locale: dateFnsLocale })
                    ) : (
                      <span>{t('selectDeliveryDate')}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] p-0 overscroll-contain" align="start">
                  <Calendar
                    mode="single"
                    selected={deliveryDate ? parseLocalDate(deliveryDate) : undefined}
                    onSelect={(date) => date && setDeliveryDate(toLocalDateString(date))}
                    disabled={(date) => date < minDate}
                    locale={dateFnsLocale}
                  />
                </PopoverContent>
              </Popover>
            </div>
        </section>
      )}

      {/* Price note + Add to Cart */}
      <div className="space-y-3">
        {product.isTorten && (
          <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden />
            <span>{t('priceNote')}</span>
          </div>
        )}
        <Button
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          className="w-full min-h-[48px] rounded-xl px-8 text-sm font-semibold shadow-none transition-colors touch-manipulation"
          size="lg"
          aria-label={
            !canAddToCart && product.isTorten
              ? t('noFlavourSelected')
              : undefined
          }
        >
          <ShoppingCart className="mr-2 h-5 w-5 shrink-0" aria-hidden />
          {product.isTorten ? t('orderButton') : t('addToCart')}
        </Button>
      </div>

      {/* Product Information Tabs (ingredients, allergens, nutrition) */}
      {showFlavourDetails && flavourDetails && (
        <>
          <Separator />
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 h-auto gap-4">
              <TabsTrigger
                value="info"
                className="rounded-none border-b-2 border-transparent px-0 pb-2 text-sm font-medium data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent"
              >
                {t('tabs.info')}
              </TabsTrigger>
              <TabsTrigger
                value="ingredients"
                className="rounded-none border-b-2 border-transparent px-0 pb-2 text-sm font-medium data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent"
              >
                {t('tabs.ingredients')}
              </TabsTrigger>
              <TabsTrigger
                value="nutrition"
                className="rounded-none border-b-2 border-transparent px-0 pb-2 text-sm font-medium data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent"
              >
                {t('tabs.nutrition')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="pt-4 space-y-4">
              {flavourDetails.allergens.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('allergens')}
                  </h3>
                  <ul className="flex flex-wrap gap-1.5">
                    {flavourDetails.allergens.map((allergen) => (
                      <li key={allergen} className="text-xs bg-muted px-2 py-1 rounded-full text-foreground/80">
                        {allergen}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {flavourDetails.ingredients.length > 0 && (
                <p className="text-sm leading-relaxed text-foreground/80">
                  {flavourDetails.ingredients.join(', ')}
                </p>
              )}
            </TabsContent>

            <TabsContent value="ingredients" className="pt-4">
              <p className="text-sm leading-relaxed text-foreground/80">
                {flavourDetails.ingredients.join(', ')}
              </p>
            </TabsContent>

            <TabsContent value="nutrition" className="pt-4">
              {flavourDetails.nutritionText ? (
                <div
                  className={flavourDetails.nutritionText.trim().startsWith('<')
                    ? 'prose prose-sm max-w-none text-sm text-foreground/90'
                    : 'whitespace-pre-line text-sm text-foreground/90'}
                  {...(flavourDetails.nutritionText.trim().startsWith('<')
                    ? { dangerouslySetInnerHTML: { __html: flavourDetails.nutritionText } }
                    : { children: flavourDetails.nutritionText })}
                />
              ) : flavourDetails.nutritionFacts.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {flavourDetails.nutritionFacts.map((fact) => (
                    <div
                      key={`${fact.label}-${fact.value}`}
                      className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3"
                    >
                      <span className="text-xs font-medium text-muted-foreground">{fact.label}</span>
                      <span className="text-sm font-semibold tabular-nums text-foreground">{fact.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('noNutrition')}</p>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
