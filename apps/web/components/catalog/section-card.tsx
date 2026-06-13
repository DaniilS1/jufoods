import Link from 'next/link'
import type { CatalogueSection } from '@/lib/catalogue-sections'

interface SectionCardProps {
  section: CatalogueSection
  label: string
  locale: string
}

export function SectionCard({ section, label, locale }: SectionCardProps) {
  return (
    <Link
      href={`/${locale}/catalog/${section.id}`}
      className="group relative overflow-hidden rounded-2xl aspect-[4/3] flex flex-col justify-end p-4 md:p-5 cursor-pointer transition-transform active:scale-[0.97] hover:scale-[1.02]"
      style={{
        background: `linear-gradient(135deg, ${section.accent} 0%, ${section.accent}bb 100%)`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      <span className="relative z-10 font-display font-semibold text-white text-sm md:text-base leading-tight drop-shadow-sm">
        {label}
      </span>
    </Link>
  )
}
