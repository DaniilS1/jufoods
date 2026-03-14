import { getTranslations } from 'next-intl/server'
import { CheckoutClient } from '@/components/checkout-client'
import { createClient, getUserSafely } from '@/lib/supabase/server'

export default async function CheckoutPage() {
  const [t, supabase] = await Promise.all([getTranslations('order'), createClient()])

  const { data: { user } } = await getUserSafely(supabase)

  let userProfile: { fullName: string; email: string } | null = null
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()
    userProfile = {
      fullName: data?.full_name ?? '',
      email: user.email ?? '',
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-8 sm:text-3xl md:text-4xl">{t('title')}</h1>
      <CheckoutClient userProfile={userProfile} />
    </div>
  )
}

