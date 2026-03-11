'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Cake, Facebook, Instagram, Mail, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LanguageSwitcher } from '@/components/language-switcher'

export function Footer() {
  const t = useTranslations('nav')
  const tCommon = useTranslations('common')
  const tContact = useTranslations('contact')
  const pathname = usePathname()
  const locale = pathname?.split('/')[1] || 'de'

  const footerLinks = {
    catalog: [
      { name: t('cakes'), href: `/${locale}?category=torten` },
      { name: t('desserts'), href: `/${locale}?category=desserts` },
      { name: t('cookies'), href: `/${locale}?category=cookies` },
      { name: t('macarons'), href: `/${locale}?category=macarons` },
      { name: t('cheesecakes'), href: `/${locale}?category=cheesecakes` },
    ],
    pages: [
      { name: t('about'), href: `/${locale}/about` },
      { name: t('contact'), href: `/${locale}/contact` },
    ],
  }

  return (
    <footer className="border-t border-primary/10 bg-gradient-to-br from-primary-50/50 via-accent/30 to-primary-50/50">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href={`/${locale}`} className="flex items-center space-x-2">
              <Cake className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-primary">jufoods</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {locale === 'uk'
                ? 'Ручне виготовлення тортів та десертів з любов\'ю та увагою до деталей.'
                : 'Handgemachte Torten und Desserts mit Liebe und Aufmerksamkeit für Details.'}
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Catalog Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t('catalog')}</h3>
            <ul className="space-y-2">
              {footerLinks.catalog.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Pages Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t('pages')}</h3>
            <ul className="space-y-2">
              {footerLinks.pages.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{tContact('title')}</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <a
                  href="mailto:info@jufoods.com"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  info@jufoods.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <a
                  href="tel:+49123456789"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  +49 123 456 789
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-primary/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              {locale === 'uk'
                ? `© ${new Date().getFullYear()} jufoods. Всі права захищені.`
                : `© ${new Date().getFullYear()} jufoods. Alle Rechte vorbehalten.`}
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <LanguageSwitcher />
              <Link href={`/${locale}/about`} className="hover:text-primary transition-colors">
                {t('about')}
              </Link>
              <Link href={`/${locale}/contact`} className="hover:text-primary transition-colors">
                {t('contact')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

