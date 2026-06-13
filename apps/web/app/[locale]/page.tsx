import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import type { Locale } from '@/i18n'

interface HomePageProps {
  params: { locale: Locale }
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = params
  const t = await getTranslations('home')

  const steps = [
    { num: 1, title: t('step1Title'), desc: t('step1Desc') },
    { num: 2, title: t('step2Title'), desc: t('step2Desc') },
    { num: 3, title: t('step3Title'), desc: t('step3Desc') },
    { num: 4, title: t('step4Title'), desc: t('step4Desc') },
  ]

  return (
    <main className="min-h-dvh">
      {/* ── Hero section ───────────────────────────────────── */}
      <section className="container py-8 md:py-12">
        <div className="text-center mb-8 md:mb-10">
          <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-tight mb-3">
            {t('title')}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">{t('subtitle')}</p>
        </div>

        {/* Two hero cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
          {/* Torten card */}
          <Link
            href={`/${locale}/catalog/feier`}
            className="group relative overflow-hidden rounded-2xl min-h-[220px] md:min-h-[280px] flex flex-col justify-end p-6 md:p-8 cursor-pointer transition-transform active:scale-[0.98] hover:scale-[1.01]"
            style={{ background: 'linear-gradient(135deg, #C4907A 0%, #A87060 100%)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            <div className="relative z-10">
              <p className="text-white/80 text-sm font-medium mb-1 uppercase tracking-widest">
                {t('heroCakesTitle')}
              </p>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
                {t('heroCakesDesc')}
              </h2>
              <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-xl border border-white/30 group-hover:bg-white/30 transition-colors">
                {t('heroCakesCta')} →
              </span>
            </div>
          </Link>

          {/* Desserts card */}
          <Link
            href={`/${locale}/catalog/desserts`}
            className="group relative overflow-hidden rounded-2xl min-h-[220px] md:min-h-[280px] flex flex-col justify-end p-6 md:p-8 cursor-pointer transition-transform active:scale-[0.98] hover:scale-[1.01]"
            style={{ background: 'linear-gradient(135deg, #8FB8A2 0%, #6D9880 100%)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            <div className="relative z-10">
              <p className="text-white/80 text-sm font-medium mb-1 uppercase tracking-widest">
                {t('heroDessertTitle')}
              </p>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
                {t('heroDessertDesc')}
              </h2>
              <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-xl border border-white/30 group-hover:bg-white/30 transition-colors">
                {t('heroDessertCta')} →
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ── How to order ───────────────────────────────────── */}
      <section className="bg-card border-y border-border py-12 md:py-16">
        <div className="container">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-10">
            {t('howTitle')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <span className="font-display text-xl font-bold text-primary">{num}</span>
                </div>
                <div>
                  <p className="font-semibold text-sm md:text-base text-foreground mb-1">{title}</p>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About strip ────────────────────────────────────── */}
      <section className="container py-12 md:py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">{t('aboutTitle')}</h2>
          <p className="text-muted-foreground text-base md:text-lg mb-6 leading-relaxed">{t('aboutText')}</p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {[t('aboutBadge1'), t('aboutBadge2'), t('aboutBadge3')].map((badge) => (
              <span
                key={badge}
                className="px-4 py-2 bg-primary/10 text-foreground text-sm font-medium rounded-full border border-primary/20"
              >
                {badge}
              </span>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/${locale}/catalog`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90 active:bg-primary/80 transition-colors"
            >
              {t('toCatalog')}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-card text-foreground font-semibold rounded-xl text-sm border border-border hover:bg-accent transition-colors"
            >
              {t('toContact')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
