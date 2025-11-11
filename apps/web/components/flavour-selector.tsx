'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { normalizeSupabaseImageUrl } from '@/lib/image-utils'
import type { FlavorOption } from '@/types/product'

interface FlavourSelectorProps {
  flavours: FlavorOption[]
  selectedFlavourId?: string
  onFlavourChange: (flavourId: string) => void
}

export function FlavourSelector({ flavours, selectedFlavourId, onFlavourChange }: FlavourSelectorProps) {
  const t = useTranslations('product')

  if (flavours.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-muted-foreground">{t('selectFlavour')}</Label>
      <RadioGroup value={selectedFlavourId} onValueChange={onFlavourChange}>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 sm:flex-wrap sm:justify-start">
          {flavours.map((flavour) => {
            const isSelected = selectedFlavourId === flavour.id

            return (
              <div key={flavour.id} className="shrink-0 sm:shrink">
                <RadioGroupItem value={flavour.id} id={flavour.id} className="peer sr-only" />
                <Label
                  htmlFor={flavour.id}
                  className={cn(
                    'flex w-[140px] flex-col items-center gap-2 rounded-2xl border-2 border-border bg-background/80 p-3 transition-all hover:border-primary/40 hover:bg-accent/60 hover:shadow-sm sm:w-[150px]',
                    isSelected && 'border-primary bg-accent shadow-md'
                  )}
                >
                  <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-muted shadow-sm">
                    <Image
                      src={normalizeSupabaseImageUrl(flavour.imageUrl)}
                      alt={flavour.displayName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <span className="text-sm font-semibold leading-tight text-foreground">{flavour.displayName}</span>
                    {flavour.priceDelta !== null && flavour.priceDelta !== 0 && (
                      <span className="text-xs text-muted-foreground">
                        {flavour.priceDelta > 0 ? `+${flavour.priceDelta.toFixed(2)} €` : `${flavour.priceDelta.toFixed(2)} €`}
                      </span>
                    )}
                  </div>
                </Label>
              </div>
            )
          })}
        </div>
      </RadioGroup>
    </div>
  )
}

