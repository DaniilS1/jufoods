'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { AlertCircle } from 'lucide-react'
import { ProfileForm } from '@/components/account/profile-form'
import { PasswordForm } from '@/components/account/password-form'
import { RecentOrders } from '@/components/account/recent-orders'
import { DesignUpload } from '@/components/account/design-upload'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n'

interface AccountClientProps {
  userId: string
  email: string
  locale: Locale
}

export interface AccountProfileResponse {
  profile: {
    fullName: string | null
    phone: string | null
    email: string
  }
  settings: {
    preferredLanguage: string | null
    marketingOptIn: boolean
    notificationsEmail: boolean
  }
}

export function AccountClient({ email, locale, userId }: AccountClientProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AccountContent email={email} locale={locale} userId={userId} />
    </QueryClientProvider>
  )
}

interface AccountContentProps {
  email: string
  locale: Locale
  userId: string
}

function AccountContent({ email, locale }: AccountContentProps) {
  const t = useTranslations('account')
  const { data, isLoading, isError, error, refetch } = useQuery<AccountProfileResponse>({
    queryKey: ['account-profile'],
    queryFn: async () => {
      const response = await fetch('/api/account/profile', { cache: 'no-store' })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Unable to load profile')
      }
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="h-96 rounded-2xl border border-border/60 bg-muted/40 animate-pulse" />
        <div className="h-96 rounded-2xl border border-border/60 bg-muted/40 animate-pulse" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-semibold text-destructive">{t('profileError')}</p>
            <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : null}</p>
          </div>
        </div>
        <Button size="sm" onClick={() => refetch()} className="self-start">
          {t('retry')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <ProfileForm data={data} email={email} locale={locale} />
        <PasswordForm />
      </div>
      <RecentOrders locale={locale} />
      <DesignUpload />
    </div>
  )
}

