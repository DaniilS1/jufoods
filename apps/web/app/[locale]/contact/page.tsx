import { getTranslations } from 'next-intl/server'
import { ContactForm } from '@/components/contact-form'

export default async function ContactPage() {
  const t = await getTranslations('contact')

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold mb-8">{t('title')}</h1>
        <ContactForm />
      </div>
    </div>
  )
}

