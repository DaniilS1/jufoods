import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { AccountClient } from '@/components/account/account-client'
import { createClient } from '@/lib/supabase/server'
import type { Locale } from '@/i18n'

interface AccountPageProps {
  params: { locale: Locale }
}

export default async function AccountPage({ params }: AccountPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${params.locale}/login`)
  }

  const tAccount = await getTranslations({ locale: params.locale, namespace: 'account' })
  const tCommon = await getTranslations({ locale: params.locale, namespace: 'common' })

  return (
    <div className="container py-8 space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">{tCommon('account')}</p>
        <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">{tAccount('title')}</h1>
        <p className="text-muted-foreground max-w-2xl">{tAccount('subtitle')}</p>
      </div>

      <AccountClient userId={user.id} email={user.email ?? ''} locale={params.locale} />
    </div>
  )
}



