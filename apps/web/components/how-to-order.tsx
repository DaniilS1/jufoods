import { getTranslations } from 'next-intl/server'
import { Search, ClipboardList, BadgeCheck, Gift, type LucideIcon } from 'lucide-react'

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
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 md:gap-4">
          {STEPS.map((step) => (
            <li key={step.num} className="rounded-2xl p-5" style={{ background: '#F8F2EF' }}>
              <div className="mb-4 flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
                  <step.Icon className="h-5 w-5" style={{ color: '#A07878' }} aria-hidden="true" />
                </span>
                <span
                  className="font-serif text-3xl font-bold leading-none"
                  style={{ color: 'rgba(160,120,120,0.38)' }}
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
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
