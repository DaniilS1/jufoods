'use client'

import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const LOCALES = [
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦' },
] as const

export function LanguageSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()

  const currentLocale = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]
  const pathWithoutLocale = pathname?.replace(new RegExp(`^/${locale}(/|$)`), '/') || '/'
  const pathWithoutLocaleClean = pathWithoutLocale === '/' ? '' : pathWithoutLocale

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="default"
          className="min-h-[44px] min-w-[44px] gap-1.5 px-3 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={
            locale === 'uk'
              ? 'Змінити мову (зараз: Українська)'
              : 'Sprache wechseln (aktuell: Deutsch)'
          }
        >
          <span aria-hidden="true">{currentLocale.flag}</span>
          <span className="font-medium">{currentLocale.label}</span>
          <ChevronDown
            className="h-4 w-4 opacity-70 shrink-0"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {LOCALES.map((loc) => {
          const href = `/${loc.code}${pathWithoutLocaleClean}`
          const isActive = locale === loc.code
          return (
            <DropdownMenuItem key={loc.code} asChild>
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-2 cursor-pointer',
                  isActive && 'bg-accent font-medium'
                )}
              >
                <span aria-hidden="true">{loc.flag}</span>
                {loc.label}
              </Link>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
