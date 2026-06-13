'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { catalogueSections } from '@/lib/catalogue-sections'
import { cn } from '@/lib/utils'

interface CatalogSidebarProps {
  locale: string
  activeSectionId: string
}

export function CatalogSidebar({ locale, activeSectionId }: CatalogSidebarProps) {
  const t = useTranslations('catalog')
  const torten = catalogueSections.filter((s) => s.group === 'torten')
  const desserts = catalogueSections.filter((s) => s.group === 'desserts')

  const NavLink = ({ id, label }: { id: string; label: string }) => (
    <Link
      href={`/${locale}/catalog/${id}`}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
        activeSectionId === id
          ? 'bg-primary/15 text-foreground font-semibold'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      )}
    >
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: catalogueSections.find((s) => s.id === id)?.accent }}
      />
      {label}
    </Link>
  )

  return (
    <aside className="w-52 shrink-0 hidden lg:flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
          {t('sectionGroupTorten')}
        </p>
        <nav className="flex flex-col gap-0.5">
          {torten.map((s) => (
            <NavLink key={s.id} id={s.id} label={t(`sections.${s.id}` as Parameters<typeof t>[0])} />
          ))}
        </nav>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
          {t('sectionGroupDesserts')}
        </p>
        <nav className="flex flex-col gap-0.5">
          {desserts.map((s) => (
            <NavLink key={s.id} id={s.id} label={t(`sections.${s.id}` as Parameters<typeof t>[0])} />
          ))}
        </nav>
      </div>
    </aside>
  )
}
