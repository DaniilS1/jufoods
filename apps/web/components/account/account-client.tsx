'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileForm } from './profile-form'
import { PasswordForm } from './password-form'
import { DesignUpload } from './design-upload'
import { RecentOrders } from './recent-orders'
import type { Locale } from '@/i18n'

export interface AccountProfileResponse {
  profile: {
    fullName: string | null
    phone: string | null
  }
  settings: {
    preferredLanguage: string | null
    marketingOptIn: boolean | null
    notificationsEmail: boolean | null
  }
}

interface AccountClientProps {
  userId: string
  email: string
  locale: Locale
}

export function AccountClient({ userId, email, locale }: AccountClientProps) {
  const t = useTranslations('account')

  const { data, isLoading, isError } = useQuery<AccountProfileResponse>({
    queryKey: ['account-profile'],
    queryFn: async () => {
      const response = await fetch('/api/account/profile', { cache: 'no-store' })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Failed to load profile')
      }
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 w-full animate-pulse rounded-lg bg-muted/60" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-destructive">
        <p>{t('profileError')}</p>
      </div>
    )
  }

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
        <TabsTrigger value="profile">{t('profileTab')}</TabsTrigger>
        <TabsTrigger value="password">{t('passwordTab')}</TabsTrigger>
        <TabsTrigger value="designs">{t('designsTab')}</TabsTrigger>
        <TabsTrigger value="orders">{t('ordersTab')}</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-6">
        <ProfileForm data={data} email={email} locale={locale} />
      </TabsContent>

      <TabsContent value="password" className="mt-6">
        <PasswordForm />
      </TabsContent>

      <TabsContent value="designs" className="mt-6">
        <DesignUpload userId={userId} locale={locale} />
      </TabsContent>

      <TabsContent value="orders" className="mt-6">
        <RecentOrders locale={locale} />
      </TabsContent>
    </Tabs>
  )
}
