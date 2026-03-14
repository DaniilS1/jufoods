import { redirect } from 'next/navigation'
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

  return (
    <div className="container py-8">
      <AccountClient
        userId={user.id}
        email={user.email ?? ''}
        locale={params.locale}
        memberSince={user.created_at}
      />
    </div>
  )
}
