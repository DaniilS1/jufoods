'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ImagePlus } from 'lucide-react'

interface CustomSectionCardProps {
  locale: string
}

export function CustomSectionCard({ locale }: CustomSectionCardProps) {
  const t = useTranslations('customTorte')

  return (
    <Link
      href={`/${locale}/products/custom`}
      className="group relative flex h-[116px] flex-col justify-end overflow-hidden rounded-2xl border-2 border-dashed border-primary/40 bg-primary/[0.04] p-3 transition-all duration-200 hover:border-primary hover:bg-primary/10 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:h-[190px] md:p-4"
    >
      {/* Top-right icon badge */}
      <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary transition-transform duration-200 group-hover:scale-105">
        <ImagePlus className="h-4 w-4" aria-hidden />
      </div>

      <div className="relative z-10">
        <p className="text-sm font-semibold leading-tight text-foreground md:text-base">
          {t('cardTitle')}
        </p>
        <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground md:text-xs">
          {t('cardSubtitle')}
        </p>
      </div>
    </Link>
  )
}
