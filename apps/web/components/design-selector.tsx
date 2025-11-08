'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CustomDesignUpload } from '@/components/custom-design-upload'
import { cn } from '@/lib/utils'
import { normalizeSupabaseImageUrl } from '@/lib/image-utils'

interface Design {
  id: string
  name_uk: string
  name_de: string
  image: string
}

interface CustomDesign {
  id: string
  image: string
  text: string
}

interface DesignSelectorProps {
  designs: Design[]
  customDesigns?: CustomDesign[]
  selectedDesignId?: string
  onDesignChange: (designId: string) => void
  locale: string
  productId: string
  onCustomDesignUpload?: (customDesign: CustomDesign) => void
}

export function DesignSelector({
  designs,
  customDesigns = [],
  selectedDesignId,
  onDesignChange,
  locale,
  productId,
  onCustomDesignUpload,
}: DesignSelectorProps) {
  const t = useTranslations('product')
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)

  const allDesigns = [
    ...designs,
    ...customDesigns.map((custom) => ({
      id: custom.id,
      name_uk: t('customDesign'),
      name_de: t('customDesign'),
      image: custom.image,
      isCustom: true,
      text: custom.text,
    })),
  ]

  if (allDesigns.length === 0 && !onCustomDesignUpload) {
    return null
  }

  const handleCustomDesignUpload = (customDesign: CustomDesign) => {
    if (onCustomDesignUpload) {
      onCustomDesignUpload(customDesign)
    }
    setIsUploadDialogOpen(false)
    // Auto-select the newly uploaded design
    onDesignChange(customDesign.id)
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">{t('selectDesign')}</Label>
      <RadioGroup value={selectedDesignId} onValueChange={onDesignChange}>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {allDesigns.map((design: any) => {
            const name = locale === 'uk' ? design.name_uk : design.name_de
            const isSelected = selectedDesignId === design.id
            const isCustom = design.isCustom

            return (
              <div key={design.id} className="shrink-0">
                <RadioGroupItem
                  value={design.id}
                  id={design.id}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={design.id}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border-2 p-3 cursor-pointer transition-all hover:bg-accent min-w-[90px] relative',
                    isSelected && 'border-primary bg-accent shadow-sm'
                  )}
                >
                  {isCustom && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                      {t('customDesign')}
                    </span>
                  )}
                  <div className="relative h-20 w-20 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={normalizeSupabaseImageUrl(design.image)}
                      alt={name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">{name}</span>
                  {isCustom && design.text && (
                    <span className="text-[10px] text-muted-foreground text-center line-clamp-1">
                      {design.text}
                    </span>
                  )}
                </Label>
              </div>
            )
          })}

          {/* Upload Custom Design Card */}
          {onCustomDesignUpload && (
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setIsUploadDialogOpen(true)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-3 cursor-pointer transition-all hover:bg-accent min-w-[90px] hover:border-primary'
                )}
              >
                <div className="relative h-20 w-20 overflow-hidden rounded-md bg-muted flex items-center justify-center">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium text-center leading-tight">
                  {t('uploadCustomDesign')}
                </span>
              </button>
            </div>
          )}
        </div>
      </RadioGroup>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('uploadCustomDesign')}</DialogTitle>
          </DialogHeader>
          <CustomDesignUpload
            productId={productId}
            onUploadComplete={handleCustomDesignUpload}
            locale={locale}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

