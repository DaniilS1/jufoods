import Link from 'next/link'
import type { CatalogueSection } from '@/lib/catalogue-sections'

interface SectionCardProps {
  section: CatalogueSection
  label: string
  locale: string
  desc?: string
  count?: number
  variant?: 'torten' | 'dessert'
}

export function SectionCard({
  section,
  label,
  locale,
  desc,
  count,
  variant = 'torten',
}: SectionCardProps) {
  const heightClass =
    variant === 'torten'
      ? 'h-[116px] md:h-[190px]'
      : 'h-[116px] md:h-[160px]'

  return (
    <Link
      href={`/${locale}/catalog/${section.id}`}
      className={`group relative overflow-hidden rounded-2xl flex flex-col justify-end cursor-pointer transition-transform active:scale-[0.97] hover:scale-[1.02] ${heightClass}`}
      style={{
        background: `linear-gradient(135deg, ${section.accent} 0%, ${section.accent}bb 100%)`,
      }}
    >
      {/* Double gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

      {/* Top-right: count badge + arrow */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
        {count !== undefined && (
          <span className="text-[11px] font-semibold text-white/90 bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 leading-none">
            {count}
          </span>
        )}
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-bold leading-none group-hover:bg-white/30 transition-colors">
          →
        </span>
      </div>

      {/* Bottom content */}
      <div className="relative z-10 p-3 md:p-4">
        <p className="font-semibold text-white text-sm md:text-base leading-tight drop-shadow-sm">
          {label}
        </p>
        {desc && (
          <p className="text-white/70 text-[11px] md:text-xs mt-0.5 leading-tight truncate">
            {desc}
          </p>
        )}
      </div>
    </Link>
  )
}
