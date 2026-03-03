'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { normalizeSupabaseImageUrl } from '@/lib/image-utils'
import { Check } from 'lucide-react'
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {flavours.map((flavour) => {
            const isSelected = selectedFlavourId === flavour.id

            return (
              <div key={flavour.id} className="relative">
                <RadioGroupItem value={flavour.id} id={flavour.id} className="peer sr-only" />
                <Label
                  htmlFor={flavour.id}
                  className={cn(
                    'group relative flex flex-col items-center gap-3 cursor-pointer p-3 md:p-4 rounded-xl transition-all duration-300',
                    'hover:scale-[1.02] active:scale-[0.98]',
                    isSelected
                      ? 'bg-primary shadow-lg shadow-primary/20 '
                      : 'bg-primary/30 hover:bg-primary/50 hover:shadow-md'
                  )}
                >
                  {/* Checkmark Badge for Selected */}
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md animate-in fade-in zoom-in-75 duration-200">
                      <Check className="h-4 w-4" />
                    </div>
                  )}

                  {/* Flavour Image */}
                  <div
                    className={cn(
                      'relative h-28 w-28 overflow-hidden rounded-lg bg-muted transition-all duration-300',
                      isSelected
                        ? ''
                        : 'group-hover:ring-2 group-hover:ring-primary/30'
                    )}
                  >
                    <Image
                      src={normalizeSupabaseImageUrl(flavour.imageUrl)}
                      alt={flavour.displayName}
                      fill
                      className={cn(
                        'object-cover transition-transform duration-300',
                        isSelected ? 'scale-100' : 'group-hover:scale-105'
                      )}
                      sizes="(max-width: 640px) 112px, 128px"
                    />
                    {/* Overlay for selected state */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/10" />
                    )}
                  </div>

                  {/* Flavour Name and Price */}
                  <div className="flex flex-col items-center gap-1 text-center w-full">
                    <span
                      className={cn(
                        'text-sm font-medium transition-colors duration-200',
                        isSelected ? 'text-primary-foreground' : 'text-foreground'
                      )}
                    >
                      {flavour.displayName}
                    </span>
                    {flavour.priceDelta !== null && flavour.priceDelta !== 0 && (
                      <span
                        className={cn(
                          'text-xs font-semibold px-2 py-0.5 rounded-full',
                          isSelected
                            ? 'bg-primary-foreground/20 text-primary-foreground'
                            : flavour.priceDelta > 0
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted-foreground/20 text-muted-foreground'
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
