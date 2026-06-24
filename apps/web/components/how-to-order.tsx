import { getTranslations } from 'next-intl/server'
import { Search, ClipboardList, BadgeCheck, Gift, ChevronRight, type LucideIcon } from 'lucide-react'

const STEPS: { num: string; Icon: LucideIcon; titleKey: string; descKey: string }[] = [
  { num: '01', Icon: Search, titleKey: 'step1Title', descKey: 'step1Desc' },
  { num: '02', Icon: ClipboardList, titleKey: 'step2Title', descKey: 'step2Desc' },
  { num: '03', Icon: BadgeCheck, titleKey: 'step3Title', descKey: 'step3Desc' },
  { num: '04', Icon: Gift, titleKey: 'step4Title', descKey: 'step4Desc' },
]

export async function HowToOrder() {
  const t = await getTranslations('home')

  return (
    <section className="px-4 pt-3.5">
      <div className="bg-white rounded-2xl border border-border p-6 md:p-8">
        <span className="text-[9px] font-bold tracking-[0.14em] uppercase block mb-6" style={{ color: '#C4A0A0' }}>
          {t('howTitle')}
        </span>
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-2">
          {STEPS.map((step, i) => (
            <li key={step.num} className="relative flex">
              <div className="group flex-1 rounded-xl border border-border/70 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:border-border">
                <div className="mb-4 flex items-center justify-between">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full"
                    style={{ background: 'rgba(196,160,160,0.14)' }}
                  >
                    <step.Icon className="h-5 w-5" style={{ color: '#A07878' }} aria-hidden="true" />
                  </span>
                  <span
                    className="font-serif text-4xl font-bold leading-none"
                    style={{ color: '#E8DADA' }}
                    aria-hidden="true"
                  >
                    {step.num}
                  </span>
                </div>
                <h3 className="mb-1 text-base font-bold text-foreground leading-tight">
                  {t(step.titleKey)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(step.descKey)}
                </p>
              </div>

              {/* Connector chevron between steps (desktop only) */}
              {i < STEPS.length - 1 && (
                <span
                  className="absolute -right-3.5 top-1/2 z-10 hidden -translate-y-1/2 lg:flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white"
                  aria-hidden="true"
                >
                  <ChevronRight className="h-4 w-4" style={{ color: '#C4A0A0' }} />
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
