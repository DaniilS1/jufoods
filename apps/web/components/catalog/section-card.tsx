import Link from 'next/link'
import Image from 'next/image'
import type { CatalogueSection } from '@/lib/catalogue-sections'

interface SectionCardProps {
  section: CatalogueSection
  label: string
  locale: string
  desc?: string
  imageUrl?: string
  count?: number
  countLabel?: string
}

export function SectionCard({ section, label, locale, desc, imageUrl, count, countLabel }: SectionCardProps) {
  return (
    <Link
      href={`/${locale}/catalog/${section.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
    >
      <div
        className="relative aspect-[4/5] w-full overflow-hidden bg-muted"
        style={
          imageUrl
            ? undefined
            : { background: `linear-gradient(135deg, ${section.accent} 0%, ${section.accent}bb 100%)` }
        }
      >
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={label}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 33vw"
          />
        )}

        {!!count && (
          <span
            title={countLabel}
            className="absolute top-2 right-2 z-10 rounded-full bg-white/90 backdrop-blur-sm px-2 py-0.5 text-xs font-semibold text-foreground shadow-sm"
          >
            {count}
          </span>
        )}
      </div>

      <div className="flex flex-col p-3 md:p-4">
        <p className="font-semibold text-foreground text-sm md:text-base leading-tight">
          {label}
        </p>
        {desc && (
          <p className="text-muted-foreground text-xs md:text-[13px] mt-0.5 leading-tight line-clamp-1">
            {desc}
          </p>
        )}
      </div>
    </Link>
  )
}
