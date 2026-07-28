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
      className="group flex flex-col overflow-hidden rounded-2xl border-2 border-dashed border-primary/40 bg-primary/[0.04] transition-all duration-300 hover:border-primary hover:bg-primary/10 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="relative flex aspect-[4/5] w-full items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary transition-transform duration-200 group-hover:scale-105 md:h-14 md:w-14">
          <ImagePlus className="h-5 w-5 md:h-6 md:w-6" aria-hidden />
        </div>
      </div>

      <div className="flex flex-col p-3 md:p-4">
        <p className="text-sm font-semibold leading-tight text-foreground md:text-base">
          {t('cardTitle')}
        </p>
        <p className="mt-0.5 text-xs leading-tight text-muted-foreground line-clamp-1 md:text-[13px]">
          {t('cardSubtitle')}
        </p>
      </div>
    </Link>
  )
}
