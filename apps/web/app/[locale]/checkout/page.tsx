import { getTranslations } from 'next-intl/server'
import { CheckoutClient } from '@/components/checkout-client'
import { createClient, getUserSafely } from '@/lib/supabase/server'

function splitFullName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

export default async function CheckoutPage() {
  const [t, supabase] = await Promise.all([getTranslations('order'), createClient()])

  const { data: { user } } = await getUserSafely(supabase)

  let userProfile: { firstName: string; lastName: string; email: string } | null = null
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()
    const full = data?.full_name?.trim() ?? ''
    const { firstName, lastName } = splitFullName(full)
    userProfile = {
      firstName,
      lastName,
      email: user.email ?? '',
    }
  }

  return (
    <div className="container py-8">
      <h1 className="font-display text-2xl font-bold mb-8 sm:text-3xl md:text-4xl">{t('title')}</h1>
      <CheckoutClient userProfile={userProfile} />
    </div>
  )
}

