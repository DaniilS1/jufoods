import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import type { Locale } from '@/i18n'
import { createClient } from '@/lib/supabase/server'

interface HomePageProps {
  params: { locale: Locale }
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = params
  const [t, supabase] = await Promise.all([getTranslations('home'), createClient()])

  const { data: categoryImages } = await supabase
    .from('category_images')
    .select('section_id, image_url')
    .in('section_id', ['main-torten', 'main-desserts'])

  const imageMap: Record<string, string> = {}
  for (const row of categoryImages ?? []) {
    imageMap[row.section_id] = row.image_url
  }

  const tortenSrc = imageMap['main-torten'] ?? '/cakes.jpeg'
  const dessertsSrc = imageMap['main-desserts'] ?? '/desserts.jpeg'

  return (
    <main className="min-h-dvh">
      {/* ── Hero image — padded + rounded (mockup style) ────── */}
      <section className="px-4 pt-5">
        <div className="relative h-[72vh] md:h-[88vh] rounded-2xl overflow-hidden">
          <Image
            src="/image231.png"
            alt="Jufoods sweets"
            fill
            priority
            className="object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(105deg, rgba(20,8,6,0.65) 0%, rgba(20,8,6,0.32) 30%, transparent 50%)' }}
          />
          <div className="absolute inset-0 flex flex-col justify-end px-8 pb-10 md:px-14 md:pb-16">
            <div className="flex flex-col">
              <span className="text-xs md:text-[10px] font-bold tracking-[0.2em] uppercase text-white/65 mb-3 block">
                {t('heroLabel')}
              </span>
              <h1
                className="font-display text-[34px] md:text-[52px] font-bold text-white mb-3 leading-tight max-w-[300px] md:max-w-[520px]"
                style={{ textShadow: '0 2px 12px rgba(0,0,0,0.25)' }}
              >
                {t('title')}
              </h1>
              <p
                className="hidden md:block text-base text-white/80 leading-relaxed max-w-[430px]"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}
              >
                {t('subtitle')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category cards — equal 50/50, big, minimal ─────── */}
      <section className="px-4 pt-3.5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">

          {/* Torten card */}
          <Link
            href={`/${locale}/torten`}
            className="group relative aspect-[3/4] rounded-[18px] overflow-hidden cursor-pointer"
          >
            <Image src={tortenSrc} alt="Torten" fill className="object-cover scale-[1]" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(59,28,18,0.25) 0%, transparent 30%)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(40,18,10,0.55) 0%, transparent 50%)' }} />
            <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/25" />
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
              <h3 className="text-3xl md:text-[38px] font-bold text-white mb-1 leading-tight" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.25)' }}>
                {t('heroCakesHeading')}
              </h3>
              <p className="text-sm md:text-[15px] leading-snug" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {t('heroCakesSubtitle')}
              </p>
              <div className="grid grid-rows-[1fr] opacity-100 mt-3 transition-all duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] [@media(hover:hover)]:grid-rows-[0fr] [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:mt-0 [@media(hover:hover)]:group-hover:grid-rows-[1fr] [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-hover:mt-3">
                <span className="flex items-center gap-1.5 min-h-0 overflow-hidden text-sm font-semibold text-white">
                  {t('heroCakesLink')} →
                </span>
              </div>
            </div>
          </Link>

          {/* Desserts card */}
          <Link
            href={`/${locale}/desserts`}
            className="group relative aspect-[3/4] rounded-[18px] overflow-hidden cursor-pointer"
          >
            <Image src={dessertsSrc} alt="Desserts" fill className="object-cover scale-[1]" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(40,20,10,0.2) 0%, transparent 30%)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(40,20,10,0.55) 0%, transparent 50%)' }} />
            <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/25" />
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
              <h3 className="text-3xl md:text-[38px] font-bold text-white mb-1 leading-tight" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.22)' }}>
                {t('heroDessertHeading')}
              </h3>
              <p className="text-sm md:text-[15px] leading-snug" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {t('heroDessertSubtitle')}
              </p>
              <div className="grid grid-rows-[1fr] opacity-100 mt-3 transition-all duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] [@media(hover:hover)]:grid-rows-[0fr] [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:mt-0 [@media(hover:hover)]:group-hover:grid-rows-[1fr] [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-hover:mt-3">
                <span className="flex items-center gap-1.5 min-h-0 overflow-hidden text-sm font-semibold text-white">
                  {t('heroDessertLink')} →
                </span>
              </div>
            </div>
          </Link>

        </div>
      </section>

      {/* ── About strip ─────────────────────────────────────── */}
      <section className="px-4 pt-3.5 pb-10 md:pb-12">
        <div className="bg-white rounded-2xl border border-border p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-bold tracking-[0.14em] uppercase block mb-2" style={{ color: '#C4A0A0' }}>
              {t('aboutTitle')}
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2 leading-tight">
              {t('aboutHeading')}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('aboutText')}</p>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end shrink-0">
            {[t('aboutBadge1'), t('aboutBadge2'), t('aboutBadge3')].map((badge) => (
              <span key={badge} className="px-4 py-1.5 text-xs font-medium text-foreground rounded-full border border-border" style={{ background: 'rgba(196,160,160,0.1)' }}>
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
