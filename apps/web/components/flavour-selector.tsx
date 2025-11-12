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
    <div className="space-y-4">
      <RadioGroup value={selectedFlavourId} onValueChange={onFlavourChange} className="w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {flavours.map((flavour) => {
            const isSelected = selectedFlavourId === flavour.id

            return (
              <div key={flavour.id} className="relative">
                <RadioGroupItem value={flavour.id} id={flavour.id} className="peer sr-only" />
                <Label
                  htmlFor={flavour.id}
                  className="group relative flex flex-col items-center gap-3 cursor-pointer"
                >
                  {/* Flavour Image with Selection Border */}
                  <div
                    className={cn(
                      'relative h-24 w-24 overflow-hidden rounded-lg bg-muted transition-all duration-200',
                      isSelected
                        ? 'ring-2 ring-primary ring-offset-1'
                        : 'ring-1 ring-transparent group-hover:ring-border'
                    )}
                  >
                    <Image
                      src={normalizeSupabaseImageUrl(flavour.imageUrl)}
                      alt={flavour.displayName}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  </div>

                  {/* Flavour Name */}
                  <div className="flex flex-col items-center gap-1 text-center">
                    <span className="text-sm font-medium text-foreground">
                      {flavour.displayName}
                    </span>
                    {flavour.priceDelta !== null && flavour.priceDelta !== 0 && (
                      <span
                        className={cn(
                          'text-xs',
                          flavour.priceDelta > 0 ? 'text-primary' : 'text-muted-foreground'
                        )}
                      >
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

