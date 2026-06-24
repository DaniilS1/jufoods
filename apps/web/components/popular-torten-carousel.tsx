'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CatalogDesignCard } from '@/components/catalog/catalog-design-card'
import { TorteBestellenModal } from '@/components/torte-bestellen-modal'
import { Button } from '@/components/ui/button'

export interface PopularTorte {
  id: string
  slug: string
  name: string
  description: string
  imageUrl: string
}

interface PopularTortenCarouselProps {
  items: PopularTorte[]
  locale: string
}

export function PopularTortenCarousel({ items, locale }: PopularTortenCarouselProps) {
  const t = useTranslations('home')
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    dragFree: false,
    containScroll: 'trimSnaps',
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const onSelect = useCallback((api: NonNullable<typeof emblaApi>) => {
    setCanPrev(api.canScrollPrev())
    setCanNext(api.canScrollNext())
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    onSelect(emblaApi)
    emblaApi.on('select', onSelect).on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect).off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  return (
    <section className="px-4 pt-3.5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <span className="text-[9px] font-bold tracking-[0.14em] uppercase block mb-1" style={{ color: '#C4A0A0' }}>
            {t('popularLabel')}
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
            {t('popularTitle')}
          </h2>
        </div>
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-full"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canPrev}
            aria-label={t('popularPrev')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-full"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canNext}
            aria-label={t('popularNext')}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-3 md:-ml-4 touch-pan-y">
          {items.map((item) => (
            <div
              key={item.id}
              className="min-w-0 shrink-0 grow-0 basis-[80%] sm:basis-[45%] lg:basis-1/4 pl-3 md:pl-4"
            >
              <CatalogDesignCard
                {...item}
                locale={locale}
                onOrder={() => setModalOpen(true)}
              />
            </div>
          ))}
        </div>
      </div>

      <TorteBestellenModal open={modalOpen} onOpenChange={setModalOpen} locale={locale} />
    </section>
  )
}
