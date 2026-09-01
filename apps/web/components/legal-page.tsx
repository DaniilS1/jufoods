import { getTranslations } from 'next-intl/server'
import { AlertTriangle } from 'lucide-react'

interface LegalSection {
  heading: string
  body: string
}

interface LegalPageProps {
  namespace: 'impressum' | 'datenschutz' | 'agb'
}

export async function LegalPage({ namespace }: LegalPageProps) {
  const t = await getTranslations(namespace)
  const tLegal = await getTranslations('legal')
  const sections = t.raw('sections') as LegalSection[]

  return (
    <div className="container py-8 md:py-12">
      <div className="mx-auto max-w-3xl px-0 md:px-6">
        <div className="mb-8 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{tLegal('draftBanner')}</p>
        </div>

        <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">{t('title')}</h1>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.heading} className="space-y-2">
              <h2 className="font-display text-lg font-semibold">{section.heading}</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
