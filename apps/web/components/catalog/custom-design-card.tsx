'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ImagePlus } from 'lucide-react'

interface CustomDesignCardProps {
  locale: string
}

export function CustomDesignCard({ locale }: CustomDesignCardProps) {
  const t = useTranslations('customTorte')

  return (
    <Link
      href={`/${locale}/products/custom`}
      className="group relative flex flex-col overflow-hidden rounded-xl border-2 border-dashed border-primary/40 bg-primary/[0.04] shadow-sm transition-colors duration-200 hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {/* Placeholder image area — matches design card aspect ratio */}
      <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden bg-primary/[0.06] sm:aspect-[3/4]">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
          <ImagePlus className="h-7 w-7" aria-hidden />
        </div>
      </div>

      {/* Footer — mirrors design card footer (title + button) */}
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <h3 className="line-clamp-1 text-sm font-semibold leading-tight text-foreground sm:text-base">
          {t('cardTitle')}
        </h3>
        <span className="mt-2 inline-flex h-8 w-full items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors group-hover:bg-primary/90">
          {t('cardCta')}
        </span>
      </div>
    </Link>
  )
}
