'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Calendar as CalendarIcon,
  Users,
  Palette,
  UtensilsCrossed,
  CalendarDays,
  ClipboardList,
  Info,
} from 'lucide-react'
import { format } from 'date-fns'
import { de, uk } from 'date-fns/locale'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { normalizeSupabaseImageUrl } from '@/lib/image-utils'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/stores/cart-store'
import { toast } from 'sonner'
import { getSubcategoriesForCategory } from '@/lib/subcategory-config'

interface TortenDesign {
  id: string
  slug: string
  name_de: string
  name_uk: string
  description_de: string | null
  description_uk: string | null
  image_url: string | null
  sub_category: string | null
}

interface NutritionFact {
  label: string
  value: string
}

interface TortenFlavour {
  id: string
  slug: string
  name_de: string
  name_uk: string
  description_de: string | null
  description_uk: string | null
  image_url: string | null
  ingredients_de: string[] | null
  ingredients_uk: string[] | null
  allergens_de: string[] | null
  allergens_uk: string[] | null
  nutrition: Record<string, string> | null
}

const FALLBACK_INGREDIENTS_DE = ['Frischkäse', 'Sahne', 'Weizenmehl', 'Zucker', 'Eier', 'Butter']
const FALLBACK_INGREDIENTS_UK = ['Вершковий сир', 'Вершки', 'Борошно', 'Цукор', 'Яйця', 'Масло']
const FALLBACK_ALLERGENS_DE = ['Milch', 'Eier', 'Weizenmehl']
const FALLBACK_ALLERGENS_UK = ['Молоко', 'Яйця', 'Пшеничне борошно']
const FALLBACK_NUTRITION: Record<'de' | 'uk', NutritionFact[]> = {
  de: [
    { label: 'Energie', value: '371,6 kcal' },
    { label: 'Eiweiß', value: '3,6 g' },
    { label: 'Fett', value: '26,8 g' },
    { label: 'Kohlenhydrate', value: '28,9 g' },
  ],
  uk: [
    { label: 'Енергетична цінність', value: '371,6 ккал' },
    { label: 'Білки', value: '3,6 г' },
    { label: 'Жири', value: '26,8 г' },
    { label: 'Вуглеводи', value: '28,9 г' },
  ],
}

interface TorteBestellenModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locale: string
  initialSubcategory?: string | null
}

const TOTAL_STEPS = 4

const STEP_ICONS = [Palette, UtensilsCrossed, CalendarDays, ClipboardList]

export function TorteBestellenModal({ open, onOpenChange, locale, initialSubcategory }: TorteBestellenModalProps) {
  const t = useTranslations('torteModal')
  const tProduct = useTranslations('product')
  const tCatalog = useTranslations('catalog')
  const addItem = useCartStore((s) => s.addItem)

  const supabase = createClient()
  const subcategories = getSubcategoriesForCategory('torten')

  // Step state
  const [step, setStep] = useState(1)

  // Step 1: Design (preset only)
  const [designs, setDesigns] = useState<TortenDesign[]>([])
  const [designsLoading, setDesignsLoading] = useState(false)
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(initialSubcategory ?? null)
  const [selectedDesign, setSelectedDesign] = useState<TortenDesign | null>(null)

  // Step 2: Flavour (only from DB)
  const [flavours, setFlavours] = useState<TortenFlavour[]>([])
  const [flavoursLoading, setFlavoursLoading] = useState(false)
  const [selectedFlavour, setSelectedFlavour] = useState<TortenFlavour | null>(null)

  // Step 3: Details
  const [persons, setPersons] = useState<string>('')
  const [deliveryDate, setDeliveryDate] = useState<string>('')
  const [remarks, setRemarks] = useState<string>('')

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(1)
      setDesigns([])
      setSelectedDesign(null)
      setFlavours([])
      setSelectedFlavour(null)
      setPersons('')
      setDeliveryDate('')
      setRemarks('')
      setActiveSubcategory(initialSubcategory ?? null)
      loadDesigns()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (open) loadDesigns()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeSubcategory])

  useEffect(() => {
    if (step === 2 && flavours.length > 0) {
      const defaultFlavour = flavours[0]
      setSelectedFlavour((prev) => {
        if (prev && flavours.some((f) => f.id === prev.id)) return prev
        return defaultFlavour
      })
    }
  }, [step, flavours])

  async function loadDesigns() {
    setDesignsLoading(true)
    try {
      let query = supabase
        .from('torten_designs')
        .select('id, slug, name_de, name_uk, description_de, description_uk, image_url, sub_category')
        .eq('category', 'torten')
        .order('name_de', { ascending: true })

      if (activeSubcategory) {
        query = query.eq('sub_category', activeSubcategory)
      }

      const { data, error } = await query
      if (!error && data) setDesigns(data as TortenDesign[])
    } finally {
      setDesignsLoading(false)
    }
  }

  async function loadFlavoursForDesign(designId: string, designImageUrl?: string | null) {
    setFlavoursLoading(true)
    setSelectedFlavour(null)
    try {
      const { data, error } = await supabase
        .from('design_flavour')
        .select(
          `flavour_id, torten_flavours (id, slug, name_de, name_uk, description_de, description_uk, image_url, ingredients_de, ingredients_uk, allergens_de, allergens_uk, nutrition)`
        )
        .eq('design_id', designId)
        .order('name_de', { foreignTable: 'torten_flavours', ascending: true })

      let mapped: TortenFlavour[] = []
      if (!error && data) {
        mapped = data.flatMap((link) => {
          const tf = link.torten_flavours
          if (!tf) return []
          const items = Array.isArray(tf) ? tf : [tf]
          return items.map((f: Record<string, unknown>) => ({
            id: f.id,
            slug: f.slug,
            name_de: f.name_de,
            name_uk: f.name_uk,
            description_de: f.description_de ?? null,
            description_uk: f.description_uk ?? null,
            image_url: f.image_url ?? null,
            ingredients_de: f.ingredients_de ?? null,
            ingredients_uk: f.ingredients_uk ?? null,
            allergens_de: f.allergens_de ?? null,
            allergens_uk: f.allergens_uk ?? null,
            nutrition: f.nutrition as Record<string, string> | null ?? null,
          })) as TortenFlavour[]
        })
      }
      if (mapped.length === 0) {
        mapped = [{
          id: 'fallback-classic',
          slug: 'fallback-classic',
          name_de: 'Klassischer Geschmack',
          name_uk: 'Класичний смак',
          description_de: null,
          description_uk: null,
          image_url: designImageUrl ?? null,
          ingredients_de: FALLBACK_INGREDIENTS_DE,
          ingredients_uk: FALLBACK_INGREDIENTS_UK,
          allergens_de: FALLBACK_ALLERGENS_DE,
          allergens_uk: FALLBACK_ALLERGENS_UK,
          nutrition: null,
        }]
      }
      setFlavours(mapped)
    } finally {
      setFlavoursLoading(false)
    }
  }

  function handlePresetDesignSelect(design: TortenDesign) {
    setSelectedDesign(design)
    setSelectedFlavour(null)
    setFlavours([])
  }

  function handleNext() {
    if (step === 1) {
      if (!selectedDesign) return
      loadFlavoursForDesign(selectedDesign.id, selectedDesign.image_url)
      setStep(2)
    } else if (step === 2) {
      if (!selectedFlavour) return
      setStep(3)
    } else if (step === 3) {
      if (!deliveryDate || !persons || parseInt(persons, 10) < 1) return
      setStep(4)
    }
  }

  function handleBack() {
    if (step > 1) setStep(step - 1)
  }

  function handleAddToCart() {
    const parsedPersons = parseInt(persons, 10)
    if (!deliveryDate || isNaN(parsedPersons) || parsedPersons < 1) return
    if (!selectedFlavour) return
    if (!selectedDesign) return

    const designName = locale === 'uk' ? selectedDesign.name_uk : selectedDesign.name_de
    const productImageUrl = normalizeSupabaseImageUrl(selectedDesign.image_url)

    addItem({
      productId: selectedDesign.id,
      productSlug: selectedDesign.slug,
      productName: designName,
      productImageUrl: productImageUrl ?? undefined,
      designId: selectedFlavour.id,
      designName: locale === 'uk' ? selectedFlavour.name_uk : selectedFlavour.name_de,
      designImageUrl: normalizeSupabaseImageUrl(selectedFlavour.image_url),
      personCount: parsedPersons,
      deliveryDate,
      remarks: remarks.trim() || undefined,
    })

    toast.success(t('addedToCart'))
    onOpenChange(false)
  }

  const step1Complete = !!selectedDesign
  const step2Complete = !!selectedFlavour
  const step3Complete = !!deliveryDate && !!persons && parseInt(persons, 10) >= 1
  const canAddToCart = step1Complete && step2Complete && step3Complete

  const getDesignDisplayName = (d: TortenDesign) => (locale === 'uk' ? d.name_uk : d.name_de)
  const getFlavourDisplayName = (f: TortenFlavour) => (locale === 'uk' ? f.name_uk : f.name_de)

  function getFlavourDetails(f: TortenFlavour) {
    const ingredients = locale === 'uk'
      ? (f.ingredients_uk ?? FALLBACK_INGREDIENTS_UK)
      : (f.ingredients_de ?? FALLBACK_INGREDIENTS_DE)
    const allergens = locale === 'uk'
      ? (f.allergens_uk ?? FALLBACK_ALLERGENS_UK)
      : (f.allergens_de ?? FALLBACK_ALLERGENS_DE)
    const nutritionRaw = f.nutrition as Record<string, unknown> | null
    const localeKey = locale === 'uk' ? 'text_uk' : 'text_de'
    const legacyText = nutritionRaw && typeof nutritionRaw.text === 'string' ? (nutritionRaw.text as string).trim() : ''
    const localeText =
      nutritionRaw && typeof nutritionRaw[localeKey] === 'string'
        ? (nutritionRaw[localeKey] as string).trim()
        : legacyText
    const nutritionText = localeText !== '' ? localeText : undefined
    const nutritionFacts: NutritionFact[] =
      nutritionText !== undefined
        ? []
        : nutritionRaw && Object.keys(nutritionRaw).length > 0
          ? Object.entries(nutritionRaw)
              .filter(([key]) => key !== 'text' && key !== 'text_de' && key !== 'text_uk')
              .map(([label, value]) => ({ label, value: String(value) }))
          : FALLBACK_NUTRITION[locale as 'de' | 'uk']
    return { ingredients, allergens, nutritionFacts, nutritionText }
  }

  const stepLabels = [t('steps.design'), t('steps.flavour'), t('steps.details'), t('steps.summary')]

  const parseLocalDate = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const toLocalDateString = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full h-[90dvh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">{t('title')}</DialogTitle>

        {/* Header with step indicator */}
        <div className="flex-none border-b bg-background px-6 py-4">
          <h2 className="font-display text-xl font-bold mb-4">{t('title')}</h2>

          <div className="flex items-center gap-0 w-full max-w-2xl mx-auto">
            {stepLabels.map((label, idx) => {
              const stepNum = idx + 1
              const isActive = step === stepNum
              const isCompleted =
                stepNum === 1 ? step1Complete && step > 1 :
                stepNum === 2 ? step2Complete && step > 2 :
                stepNum === 3 ? step3Complete && step > 3 : false
              const StepIcon = STEP_ICONS[idx]

              return (
                <div key={stepNum} className="flex items-center flex-1 min-w-0">
                  <button
                    onClick={() => {
                      const canGoTo =
                        stepNum < step ||
                        (stepNum === 2 && step1Complete) ||
                        (stepNum === 3 && step1Complete && step2Complete) ||
                        (stepNum === 4 && step1Complete && step2Complete && step3Complete)
                      if (canGoTo) {
                        if (stepNum === 2 && selectedDesign) {
                          loadFlavoursForDesign(selectedDesign.id)
                        }
                        setStep(stepNum)
                      }
                    }}
                    className={cn(
                      'flex items-center gap-2 shrink-0 transition-colors rounded-lg px-2 py-1.5 min-h-[44px] touch-manipulation',
                      isActive ? 'text-primary' : isCompleted ? 'text-primary/80 cursor-pointer hover:text-primary hover:bg-primary/5 active:text-primary' : 'text-muted-foreground cursor-default'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold border-2 transition-all shrink-0',
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary'
                          : isCompleted
                          ? 'bg-primary/20 text-primary border-primary/40'
                          : 'bg-muted text-muted-foreground border-muted'
                      )}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                    </span>
                    <span className={cn('text-sm font-medium hidden sm:inline', isActive && 'text-primary')}>
                      {label}
                    </span>
                  </button>
                  {idx < stepLabels.length - 1 && (
                    <div className={cn('mx-2 flex-1 h-0.5 rounded-full transition-colors', step > stepNum ? 'bg-primary/40' : 'bg-border')} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {/* STEP 1: Design */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    {t('step1Title')}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{t('step1Description')}</p>
                </div>

                <nav className="flex gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1 border-b border-border">
                  <button
                    onClick={() => setActiveSubcategory(null)}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-3 rounded-t-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 border-b-2 -mb-px',
                      !activeSubcategory
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-muted-foreground hover:text-primary hover:bg-primary/5'
                    )}
                  >
                    {t('allDesigns')}
                  </button>
                  {subcategories.map((sub) => {
                    const Icon = sub.icon
                    const isActive = activeSubcategory === sub.id
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setActiveSubcategory(sub.id)}
                        className={cn(
                          'flex items-center gap-1.5 px-4 py-3 rounded-t-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 border-b-2 -mb-px',
                          isActive
                            ? 'border-primary text-primary bg-primary/5'
                            : 'border-transparent text-muted-foreground hover:text-primary hover:bg-primary/5'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{tCatalog(`subcategories.torten.${sub.translationKey}`)}</span>
                      </button>
                    )
                  })}
                </nav>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {designsLoading ? (
                    <div className="col-span-2 flex items-center justify-center py-12 text-muted-foreground">
                      <span>{t('loading')}</span>
                    </div>
                  ) : (
                    designs.map((design) => {
                      const isSelected = selectedDesign?.id === design.id
                      return (
                        <button
                          key={design.id}
                          onClick={() => handlePresetDesignSelect(design)}
                          className={cn(
                            'group relative overflow-hidden rounded-2xl text-left transition-all duration-200 border-2 flex flex-col',
                            isSelected ? 'border-primary shadow-lg shadow-primary/20 scale-[1.02]' : 'border-transparent hover:border-primary/30 hover:scale-[1.01]'
                          )}
                        >
                          <div className="aspect-square relative bg-muted overflow-hidden rounded-t-2xl">
                            <Image
                              src={normalizeSupabaseImageUrl(design.image_url)}
                              alt={getDesignDisplayName(design)}
                              fill
                              className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            />
                            {isSelected && (
                              <>
                                <div className="absolute inset-0 bg-primary/20" />
                                <div className="absolute top-1.5 right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                                  <Check className="h-3 w-3" />
                                </div>
                              </>
                            )}
                          </div>
                          <div className={cn('px-2 py-1.5 min-h-[52px] flex flex-col justify-center rounded-b-2xl', isSelected ? 'bg-primary/10' : 'bg-card')}>
                            <p className="font-medium text-sm leading-tight line-clamp-1">{getDesignDisplayName(design)}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-tight min-h-[2rem]">
                              {(locale === 'uk' ? design.description_uk : design.description_de) || '\u00A0'}
                            </p>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>

              </div>
            )}

            {/* STEP 2: Geschmack (no tabs, only DB flavours) */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <UtensilsCrossed className="h-5 w-5 text-primary" />
                    {t('step2Title')}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{t('step2Description')}</p>
                </div>

                {flavoursLoading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">{t('loading')}</div>
                ) : flavours.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">{t('noFlavours')}</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {flavours.map((flavour) => {
                      const isSelected = selectedFlavour?.id === flavour.id
                      const { ingredients, allergens, nutritionFacts, nutritionText } = getFlavourDetails(flavour)
                      return (
                        <div
                          key={flavour.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedFlavour(flavour)}
                          onKeyDown={(e) => e.key === 'Enter' && setSelectedFlavour(flavour)}
                          className={cn(
                            'group relative overflow-hidden rounded-2xl text-left transition-all duration-200 border-2 flex flex-col cursor-pointer',
                            isSelected ? 'border-primary shadow-lg shadow-primary/20 scale-[1.02]' : 'border-transparent hover:border-primary/30 hover:scale-[1.01]'
                          )}
                        >
                          <div className="aspect-square relative bg-muted overflow-hidden rounded-t-2xl">
                            <Image
                              src={normalizeSupabaseImageUrl(flavour.image_url)}
                              alt={getFlavourDisplayName(flavour)}
                              fill
                              className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            />
                            {isSelected && (
                              <>
                                <div className="absolute inset-0 bg-primary/20" />
                                <div className="absolute top-1.5 right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                                  <Check className="h-3 w-3" />
                                </div>
                              </>
                            )}
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute bottom-1.5 right-1.5 z-10 h-9 w-9 rounded-full bg-black/50 text-white hover:bg-black/70 active:bg-black/80"
                                  onClick={(e) => e.stopPropagation()}
                                  title={t('details')}
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[min(20rem,calc(100vw-2rem))] p-0" align="start" onClick={(e) => e.stopPropagation()}>
                                <div
                                  className="h-[380px] overflow-y-auto"
                                  onWheel={(e) => e.nativeEvent.stopPropagation()}
                                >
                                  <div className="p-4 space-y-4">
                                    <h4 className="font-semibold">{getFlavourDisplayName(flavour)}</h4>
                                    {(locale === 'uk' ? flavour.description_uk : flavour.description_de) && (
                                      <p className="text-sm text-muted-foreground">
                                        {locale === 'uk' ? flavour.description_uk : flavour.description_de}
                                      </p>
                                    )}
                                    <div className="space-y-3 pt-2 border-t">
                                      {ingredients.length > 0 && (
                                        <div>
                                          <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{tProduct('ingredients')}</h5>
                                          <p className="text-sm">{ingredients.join(', ')}</p>
                                        </div>
                                      )}
                                      {allergens.length > 0 && (
                                        <div>
                                          <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{tProduct('allergens')}</h5>
                                          <ul className="space-y-1 text-sm">
                                            {allergens.map((a) => (
                                              <li key={a} className="flex items-center gap-2">
                                                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                                                {a}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {(nutritionText || nutritionFacts.length > 0) && (
                                        <div>
                                          <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                                            {locale === 'uk' ? 'Харчова цінність (на 100 г)' : tProduct('nutritionPer100g')}
                                          </h5>
                                          {nutritionText ? (
                                            <div
                                              className={
                                                nutritionText.trim().startsWith('<')
                                                  ? 'prose prose-sm max-w-none text-sm text-foreground'
                                                  : 'whitespace-pre-line text-sm text-foreground'
                                              }
                                              {...(nutritionText.trim().startsWith('<')
                                                ? { dangerouslySetInnerHTML: { __html: nutritionText } }
                                                : { children: nutritionText })}
                                            />
                                          ) : (
                                            <div className="grid grid-cols-2 gap-2">
                                              {nutritionFacts.map((fact) => (
                                                <div key={fact.label} className="rounded-lg bg-muted/50 p-2">
                                                  <span className="text-xs text-muted-foreground block">{fact.label}</span>
                                                  <span className="text-sm font-medium">{fact.value}</span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className={cn('px-2 py-1.5 min-h-[52px] flex flex-col justify-center rounded-b-2xl', isSelected ? 'bg-primary/10' : 'bg-card')}>
                            <p className="font-medium text-sm leading-tight line-clamp-1">{getFlavourDisplayName(flavour)}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-tight min-h-[2rem]">
                              {(locale === 'uk' ? flavour.description_uk : flavour.description_de) || '\u00A0'}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Details */}
            {step === 3 && (
              <div className="space-y-6 flex flex-col gap-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    {t('step3Title')}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{t('step3Description')}</p>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="persons" className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                        <Users className="h-4 w-4 text-primary/70" />
                        {t('persons')} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="persons"
                        type="number"
                        min={1}
                        max={500}
                        value={persons}
                        onChange={(e) => setPersons(e.target.value)}
                        placeholder={t('personsPlaceholder')}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                        <CalendarIcon className="h-4 w-4 text-primary/70" />
                        {t('deliveryDate')} <span className="text-destructive">*</span>
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !deliveryDate && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
{deliveryDate ? (
                            format(parseLocalDate(deliveryDate), 'PPP', { locale: locale === 'uk' ? uk : de })
                            ) : (
                              <span>{t('deliveryDate')}</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={deliveryDate ? parseLocalDate(deliveryDate) : undefined}
                            onSelect={(date) => date && setDeliveryDate(toLocalDateString(date))}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            classNames={{ today: '' }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="remarks" className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                      {t('remarks')}
                    </Label>
                    <Textarea
                      id="remarks"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder={t('remarksPlaceholder')}
                      className="min-h-[80px] resize-y"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Zusammenfassung */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    {t('step4Title')}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{t('step4Description')}</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border-2 border-border bg-card p-4 shadow-sm overflow-hidden">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Palette className="h-3.5 w-3.5" />
                          {t('summaryDesign')}
                        </span>
                        {selectedDesign?.sub_category && (
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {tCatalog(`subcategories.torten.${selectedDesign.sub_category}` as 'subcategories.torten.hochzeit')}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-muted shrink-0 ring-2 ring-primary/20">
                          <Image
                            src={normalizeSupabaseImageUrl(selectedDesign?.image_url) ?? '/placeholder-cake.svg'}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="font-semibold text-sm">
                            {getDesignDisplayName(selectedDesign!)}
                          </p>
                          {(locale === 'uk' ? selectedDesign?.description_uk : selectedDesign?.description_de) && (
                            <p className="text-xs text-muted-foreground line-clamp-3">
                              {locale === 'uk' ? selectedDesign?.description_uk : selectedDesign?.description_de}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border-2 border-border bg-card p-4 shadow-sm overflow-hidden">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-3">
                        <UtensilsCrossed className="h-3.5 w-3.5" />
                        {t('summaryFlavour')}
                      </span>
                      <div className="flex gap-3">
                        <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-muted shrink-0 ring-2 ring-primary/20">
                          <Image
                            src={normalizeSupabaseImageUrl(selectedFlavour?.image_url)}
                            alt={selectedFlavour ? getFlavourDisplayName(selectedFlavour) : ''}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <p className="font-semibold text-sm">{selectedFlavour && getFlavourDisplayName(selectedFlavour)}</p>
                          {(locale === 'uk' ? selectedFlavour?.description_uk : selectedFlavour?.description_de) && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {locale === 'uk' ? selectedFlavour?.description_uk : selectedFlavour?.description_de}
                            </p>
                          )}
                          {selectedFlavour && (() => {
                            const { ingredients } = getFlavourDetails(selectedFlavour)
                            return ingredients.length > 0 ? (
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{tProduct('ingredients')}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">{ingredients.join(', ')}</p>
                              </div>
                            ) : null
                          })()}
                          {selectedFlavour && (() => {
                            const { allergens } = getFlavourDetails(selectedFlavour)
                            return allergens.length > 0 ? (
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{tProduct('allergens')}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">{allergens.join(', ')}</p>
                              </div>
                            ) : null
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border-2 border-border bg-card p-4 shadow-sm">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {t('summaryDate')}
                      </span>
                      <p className="font-semibold">
                        {deliveryDate &&
                          format(parseLocalDate(deliveryDate), 'PPP', { locale: locale === 'uk' ? uk : de })}
                      </p>
                    </div>
                    <div className="rounded-2xl border-2 border-border bg-card p-4 shadow-sm">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <Users className="h-3.5 w-3.5" />
                        {t('summaryPersons')}
                      </span>
                      <p className="font-semibold">{persons}</p>
                    </div>
                  </div>

                  {remarks.trim() && (
                    <div className="rounded-2xl border-2 border-border bg-card p-4 shadow-sm">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        {t('summaryRemarks')}
                      </span>
                      <p className="text-sm whitespace-pre-wrap">{remarks.trim()}</p>
                    </div>
                  )}

                  <Button
                    onClick={handleAddToCart}
                    className="w-full gap-2 h-12 text-base mt-4"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {t('addToCart')}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar - hidden on step 4 */}
          {step !== 4 && (
          <div className="hidden lg:flex flex-col w-80 border-l shrink-0">
            <div className="flex-1 overflow-y-auto p-5 bg-gradient-to-b from-muted/30 to-background">
              <div className="flex items-center gap-2 mb-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </div>
                <h4 className="font-semibold text-base">{t('orderSummary')}</h4>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border bg-background p-3 shadow-sm">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Palette className="h-3.5 w-3.5" />
                    {t('summaryDesign')}
                  </span>
                  {selectedDesign ? (
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-muted shrink-0 ring-2 ring-primary/20">
                        <Image
                          src={normalizeSupabaseImageUrl(selectedDesign?.image_url)}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm leading-tight">
                          {getDesignDisplayName(selectedDesign!)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic py-1">{t('notSelected')}</p>
                  )}
                </div>

                <div className="rounded-xl border bg-background p-3 shadow-sm">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <UtensilsCrossed className="h-3.5 w-3.5" />
                    {t('summaryFlavour')}
                  </span>
                  {selectedFlavour ? (
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-muted shrink-0 ring-2 ring-primary/20">
                        <Image
                          src={normalizeSupabaseImageUrl(selectedFlavour.image_url)}
                          alt={getFlavourDisplayName(selectedFlavour)}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                      <p className="font-medium text-sm leading-tight">{getFlavourDisplayName(selectedFlavour)}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic py-1">{t('notSelected')}</p>
                  )}
                </div>

                <div className="rounded-xl border bg-background p-3 shadow-sm">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {t('summaryDate')}
                  </span>
                  {deliveryDate ? (
                    <p className="font-medium text-sm">
                      {parseLocalDate(deliveryDate).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'de-DE', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic py-1">{t('notSelected')}</p>
                  )}
                </div>

                <div className="rounded-xl border bg-background p-3 shadow-sm">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Users className="h-3.5 w-3.5" />
                    {t('summaryPersons')}
                  </span>
                  {persons ? (
                    <p className="font-medium text-sm">{persons}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic py-1">{t('notSelected')}</p>
                  )}
                </div>

                {remarks.trim() && (
                  <div className="rounded-xl border bg-background p-3 shadow-sm">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      {t('summaryRemarks')}
                    </span>
                    <p className="text-sm whitespace-pre-wrap line-clamp-3">{remarks.trim()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
        </div>

        <div className="flex-none border-t bg-background px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack} disabled={step === 1} className="gap-1.5">
            <ChevronLeft className="h-4 w-4" />
            {t('back')}
          </Button>
          <div className="flex items-center gap-2">
            {step === TOTAL_STEPS && (
              <Button onClick={handleAddToCart} className="gap-2 lg:hidden">
                <ShoppingCart className="h-4 w-4" />
                {t('addToCart')}
              </Button>
            )}
            {step < TOTAL_STEPS && (
              <Button
                onClick={handleNext}
                disabled={
                  step === 1 ? !step1Complete :
                  step === 2 ? !step2Complete :
                  step === 3 ? !step3Complete : false
                }
                className="gap-1.5"
              >
                {t('next')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
