'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { normalizeSupabaseImageUrl } from '@/lib/image-utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import type { DesignOption } from '@/types/product'

export type DesignShowAllApi = { open: () => void; active: boolean }

interface DesignSelectorProps {
  designs: DesignOption[]
  selectedDesignId?: string
  onDesignChange: (designId: string) => void
  onShowAllApi?: (api: DesignShowAllApi | null) => void
}

function useSelectorColumns() {
  const [columns, setColumns] = useState(2)

  useEffect(() => {
    const getColumns = () => {
      if (typeof window === 'undefined') return 2
      if (window.matchMedia('(min-width: 1024px)').matches) return 4
      if (window.matchMedia('(min-width: 640px)').matches) return 3
      return 2
    }

    setColumns(getColumns())

    const mq1024 = window.matchMedia('(min-width: 1024px)')
    const mq640 = window.matchMedia('(min-width: 640px)')

    const handler = () => setColumns(getColumns())

    mq1024.addEventListener?.('change', handler)
    mq640.addEventListener?.('change', handler)

    // Safari fallback
    mq1024.addListener?.(handler)
    mq640.addListener?.(handler)

    return () => {
      mq1024.removeEventListener?.('change', handler)
      mq640.removeEventListener?.('change', handler)
      mq1024.removeListener?.(handler)
      mq640.removeListener?.(handler)
    }
  }, [])

  return columns
}

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)

    const handler = () => setReducedMotion(mq.matches)

    mq.addEventListener?.('change', handler)
    mq.addListener?.(handler)

    return () => {
      mq.removeEventListener?.('change', handler)
      mq.removeListener?.(handler)
    }
  }, [])

  return reducedMotion
}

export function DesignSelector({
  designs,
  selectedDesignId,
  onDesignChange,
  onShowAllApi,
}: DesignSelectorProps) {
  const tCatalog = useTranslations('catalog')
  const columns = useSelectorColumns()
  const prefersReducedMotion = usePrefersReducedMotion()
  const shouldUseSlider = designs.length > columns

  const [showAllOpen, setShowAllOpen] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)

  const openShowAll = useCallback(() => setShowAllOpen(true), [])

  useEffect(() => {
    if (!onShowAllApi) return
    onShowAllApi({ open: openShowAll, active: shouldUseSlider })
    return () => onShowAllApi(null)
  }, [onShowAllApi, openShowAll, shouldUseSlider])

  const sliderItemStyle = useMemo(
    () => ({
      // In Slider-Mode sollen die Karten kleiner sein als die Grid-Variante,
      // damit bei vielen Items mehrere Karten pro Viewport passen.
      flex: '0 0 auto',
      width: 'clamp(112px, 28vw, 138px)',
    }),
    []
  )

  const scrollByPage = (direction: -1 | 1) => {
    const el = sliderRef.current
    if (!el) return
    const amount = el.clientWidth
    el.scrollBy({ left: direction * amount, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
  }

  const renderDesignCard = (
    design: DesignOption,
    idPrefix: string,
    wrapperClassName: string = '',
    wrapperStyle?: CSSProperties
  ) => {
    const isSelected = selectedDesignId === design.id
    const radioId = `${idPrefix}${design.id}`

    return (
      <div key={design.id} className={cn('relative min-w-0', wrapperClassName)} style={wrapperStyle}>
        <RadioGroupItem value={design.id} id={radioId} className="peer sr-only" />
        <Label
          htmlFor={radioId}
          className={cn(
            'group relative w-full min-w-0 flex flex-col items-center gap-3 cursor-pointer py-4 px-3 md:py-5 md:px-4 rounded-xl transition-all duration-300',
            'hover:scale-[1.02] active:scale-[0.98]',
            isSelected
              ? 'bg-primary shadow-lg shadow-primary/20'
              : 'bg-primary/30 hover:bg-primary/50 hover:shadow-md active:bg-primary/50 active:shadow-md'
          )}
        >
          {isSelected && (
            <div className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md animate-in fade-in zoom-in-75 duration-200">
              <Check className="h-4 w-4" aria-hidden />
            </div>
          )}

          <div
            className={cn(
              'relative w-full aspect-square overflow-hidden rounded-lg bg-muted transition-all duration-300',
              isSelected
                ? ''
                : 'group-hover:ring-2 group-hover:ring-primary/30 group-active:ring-2 group-active:ring-primary/30'
            )}
          >
            <Image
              src={normalizeSupabaseImageUrl(design.imageUrl)}
              alt={design.name}
              fill
              className={cn(
                'object-cover transition-transform duration-300'
              )}
              sizes="(max-width: 640px) 148px, 160px"
            />
            {isSelected && <div className="absolute inset-0 bg-primary/10" />}
          </div>

          <div className="flex flex-col items-center gap-1 text-center w-full">
            <span
              className={cn(
                // Allow up to 2 lines so long labels don't get cut with ellipsis.
                'text-sm font-medium transition-colors duration-200 w-full line-clamp-2 leading-tight min-h-[2rem]',
                isSelected ? 'text-primary-foreground' : 'text-foreground'
              )}
            >
              {design.name}
            </span>
          </div>
        </Label>
      </div>
    )
  }

  if (designs.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <RadioGroup value={selectedDesignId} onValueChange={onDesignChange} className="w-full">
        {shouldUseSlider ? (
          <div className="relative group w-full max-w-full overflow-hidden">
            {/* Left/Right arrows */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => scrollByPage(-1)}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-background/70 backdrop-blur-sm hover:bg-background rounded-full shadow-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => scrollByPage(1)}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-background/70 backdrop-blur-sm hover:bg-background rounded-full shadow-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>

            <div
              ref={sliderRef}
              className={cn(
                'flex w-full gap-2.5 md:gap-4 overflow-x-auto scrollbar-hide overscroll-contain touch-manipulation py-4 md:py-5',
                'snap-x snap-mandatory'
              )}
            >
              {designs.map((design) =>
                renderDesignCard(design, 'design-slider-', 'snap-start flex-none', sliderItemStyle)
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {designs.map((design) => renderDesignCard(design, 'design-grid-'))}
          </div>
        )}
      </RadioGroup>

      {shouldUseSlider && (
        <Dialog open={showAllOpen} onOpenChange={setShowAllOpen}>
          <DialogContent
            className={cn(
              'flex max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem))] w-[calc(100vw-1.5rem)] max-w-6xl flex-col gap-0 overflow-hidden p-0 sm:w-full'
            )}
          >
            <div className="shrink-0 border-b border-border/60 px-6 pb-3 pt-6 pr-14">
              <DialogTitle className="leading-snug">{tCatalog('viewDesigns')}</DialogTitle>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
              <RadioGroup value={selectedDesignId} onValueChange={onDesignChange} className="w-full">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 md:gap-4">
                  {designs.map((design) => renderDesignCard(design, 'design-all-'))}
                </div>
              </RadioGroup>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
