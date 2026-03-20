'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ChevronRight, ShoppingCart, Calendar as CalendarIcon, Users, Layers } from 'lucide-react'
import { format } from 'date-fns'
import { de, uk } from 'date-fns/locale'
import { ProductImageSlider } from '@/components/product-image-slider'
import { DesignSelector, type DesignShowAllApi } from '@/components/design-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/stores/cart-store'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'
import type { DesignOption, NutritionFact } from '@/types/product'

interface FlavourData {
  id: string
  slug: string
  name: string
  description: string
  imageUrl: string
  ingredients: string[]
  allergens: string[]
  nutritionFacts: NutritionFact[]
  nutritionText?: string
  imagesUrls?: string[]
}

interface FlavourDetailWrapperProps {
  flavour: FlavourData
  designs: DesignOption[]
  locale: string
  categoryName: string
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

export function FlavourDetailWrapper({ flavour, designs, locale, categoryName }: FlavourDetailWrapperProps) {
  const t = useTranslations('product')
  const tCatalog = useTranslations('catalog')
  const tNav = useTranslations('nav')
  const { addItem } = useCartStore()
  const { openCart } = useUIStore()

  const initialDesignId = useMemo(() => designs[0]?.id ?? '', [designs])
  const [selectedDesignId, setSelectedDesignId] = useState<string>(initialDesignId)
  const [deliveryDate, setDeliveryDate] = useState<string>('')
  const [personCount, setPersonCount] = useState<string>('')
  const [designShowAllApi, setDesignShowAllApi] = useState<DesignShowAllApi | null>(null)

  const dateFnsLocale = locale === 'uk' ? uk : de
  const minDate = new Date(new Date().setHours(0, 0, 0, 0))

  const parsedCount = parseInt(personCount, 10)
  const isValidCount = !Number.isNaN(parsedCount) && parsedCount >= 1
  const canAddToCart = !!selectedDesignId && !!deliveryDate && isValidCount

  const selectedDesign = useMemo(
    () => designs.find((d) => d.id === selectedDesignId) ?? designs[0] ?? null,
    [designs, selectedDesignId]
  )

  const handleAddToCart = useCallback(() => {
    if (!selectedDesignId || !deliveryDate || !isValidCount || !selectedDesign) return

    addItem({
      productId: flavour.id,
      productSlug: flavour.slug,
      productName: flavour.name,
      productImageUrl: flavour.imageUrl,
      designId: selectedDesign.id,
      designName: selectedDesign.name,
      designImageUrl: selectedDesign.imageUrl,
      personCount: parsedCount,
      deliveryDate,
    })
    openCart()
  }, [flavour, selectedDesignId, selectedDesign, deliveryDate, isValidCount, parsedCount, addItem, openCart])

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-2">
      <nav
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link href={`/${locale}`} className="hover:text-primary transition-colors">
          {tNav('catalog')}
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        <Link
          href={`/${locale}?category=torten&view=flavours`}
          className="hover:text-primary transition-colors"
        >
          {categoryName}
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        <span className="text-foreground truncate min-w-0">{flavour.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start lg:gap-12">
        <div className="w-full max-w-md lg:max-w-lg">
          <ProductImageSlider
            productImageUrl={flavour.imageUrl}
            productName={flavour.name}
            productId={flavour.id}
            additionalImages={flavour.imagesUrls}
          />
        </div>

        <div className="flex flex-col gap-8 lg:sticky lg:top-8">
          {/* Flavour Header */}
          <section className="space-y-4" aria-labelledby="flavour-title">
            <h1
              id="flavour-title"
              className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl text-balance"
            >
              {flavour.name}
            </h1>
            {flavour.description && (
              <div
                className="prose prose-sm max-w-none text-muted-foreground md:text-lg [&_ul]:list-none [&_ol]:list-none [&_ul]:!pl-0 [&_ol]:!pl-0"
                dangerouslySetInnerHTML={{ __html: flavour.description }}
              />
            )}
          </section>

          {/* Design Selector */}
          {designs.length > 0 && (
            <section className="space-y-4" aria-labelledby="design-heading">
              <div className="flex flex-col gap-2">
                <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-2">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    {selectedDesign && (
                      <Badge
                        variant="default"
                        className="text-sm bg-primary rounded-full font-normal px-2 py-0.5 flex items-center gap-1.5"
                      >
                        <Layers className="size-3.5 shrink-0" aria-hidden />
                        {selectedDesign.name}
                      </Badge>
                    )}
                    {isValidCount && (
                      <Badge
                        variant="default"
                        className="text-sm bg-primary rounded-full font-normal px-2 py-0.5 flex items-center gap-1.5"
                      >
                        <Users className="size-3.5 shrink-0" aria-hidden />
                        {personCount}
                      </Badge>
                    )}
                    {deliveryDate && (
                      <Badge
                        variant="default"
                        className="text-sm bg-primary rounded-full font-normal px-2 py-0.5 flex items-center gap-1.5"
                      >
                        <CalendarIcon className="size-3.5 shrink-0" aria-hidden />
                        {format(parseLocalDate(deliveryDate), 'PPP', { locale: dateFnsLocale })}
                      </Badge>
                    )}
                  </div>
                  {designShowAllApi?.active && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="ml-auto h-auto rounded-full text-sm font-normal px-2.5 py-0.5 gap-1 shrink-0 touch-manipulation"
                      onClick={() => designShowAllApi.open()}
                    >
                      {tCatalog('all')}
                      <ChevronRight className="size-3.5 shrink-0" aria-hidden />
                    </Button>
                  )}
                </div>
              </div>
              <DesignSelector
                designs={designs}
                selectedDesignId={selectedDesignId}
                onDesignChange={setSelectedDesignId}
                onShowAllApi={setDesignShowAllApi}
              />
            </section>
          )}

          {/* Order Options */}
          <section
            className="space-y-4 rounded-xl border-none border-border/60 p-0"
            aria-labelledby="order-options-heading"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="person-count" className="flex items-center gap-1.5 text-sm font-medium">
                  <Users className="h-4 w-4 shrink-0 text-primary/70" aria-hidden />
                  {t('personCount')} <span className="text-destructive" aria-hidden>*</span>
                </Label>
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
                      aria-label={
                        deliveryDate
                          ? `${t('deliveryDate')}: ${format(parseLocalDate(deliveryDate), 'PPP', { locale: dateFnsLocale })}`
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
            </div>
          </section>

          {/* Add to Cart */}
          <div>
            <Button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className="w-full min-h-[48px] rounded-full px-8 py-6 text-base font-semibold shadow-none transition-shadow touch-manipulation"
              size="lg"
              aria-label={!canAddToCart ? t('noDesignSelected') : undefined}
            >
              <ShoppingCart className="mr-2 h-5 w-5 shrink-0" aria-hidden />
              {t('addToCart')}
            </Button>
          </div>

          {/* Flavour Information */}
          <Separator />
          <section className="space-y-6" aria-labelledby="flavour-info-heading">
            <h2
              id="flavour-info-heading"
              className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {t('ingredients')}
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {flavour.ingredients.join(', ')}
            </p>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t('allergens')}
              </h3>
              <ul className="space-y-1.5 text-sm text-foreground/90">
                {flavour.allergens.map((allergen) => (
                  <li key={allergen} className="flex items-center gap-2">
                    {allergen}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {locale === 'uk' ? 'Харчова цінність (на 100 г)' : t('nutritionPer100g')}
              </h3>
              {flavour.nutritionText ? (
                <div
                  className={
                    flavour.nutritionText.trim().startsWith('<')
                      ? 'prose prose-sm max-w-none text-sm text-foreground/90'
                      : 'whitespace-pre-line text-sm text-foreground/90'
                  }
                  {...(flavour.nutritionText.trim().startsWith('<')
                    ? { dangerouslySetInnerHTML: { __html: flavour.nutritionText } }
                    : { children: flavour.nutritionText })}
                />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {flavour.nutritionFacts.map((fact) => (
                    <div
                      key={`${fact.label}-${fact.value}`}
                      className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3"
                    >
                      <span className="text-xs font-medium text-muted-foreground">{fact.label}</span>
                      <span className="text-sm font-semibold tabular-nums text-foreground">{fact.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
