'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { User, Lock, Palette, Package, AlertCircle, RotateCcw } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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

type Section = 'profile' | 'password' | 'designs' | 'orders'

interface AccountClientProps {
  userId: string
  email: string
  locale: Locale
  memberSince?: string
}

export function AccountClient({ userId, email, locale, memberSince }: AccountClientProps) {
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
      <AccountContent
        userId={userId}
        email={email}
        locale={locale}
        memberSince={memberSince}
      />
    </QueryClientProvider>
  )
}

function AccountContent({ userId, email, locale, memberSince }: AccountClientProps) {
  const t = useTranslations('account')
  const tCommon = useTranslations('common')
  const [activeSection, setActiveSection] = useState<Section>('profile')

  const { data, isLoading, isError, refetch } = useQuery<AccountProfileResponse>({
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

  const navItems: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: t('profileTab'), icon: User },
    { id: 'password', label: t('passwordTab'), icon: Lock },
    { id: 'designs', label: t('designsTab'), icon: Palette },
    { id: 'orders', label: t('ordersTab'), icon: Package },
  ]

  const displayName = data?.profile.fullName ?? email.split('@')[0]
  const initials = getInitials(data?.profile.fullName ?? email)

  const formattedMemberSince = memberSince
    ? new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
        new Date(memberSince)
      )
    : null

  if (isLoading) {
    return <AccountSkeleton />
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{t('profileError')}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} className="self-start sm:self-auto gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          {t('retry')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-[260px_1fr] lg:gap-8">

      {/* ── Mobile: compact user strip ── */}
      <div className="flex items-center gap-3 rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 lg:hidden">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </div>

      {/* ── Mobile: horizontal scrollable nav ── */}
      <nav
        aria-label="Account navigation"
        className="flex gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 overscroll-contain touch-manipulation pb-1 lg:hidden"
      >
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveSection(id)}
            className={[
              'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-11 touch-manipulation',
              activeSection === id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            ].join(' ')}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        ))}
      </nav>

      {/* ── Desktop: sidebar ── */}
      <aside className="hidden lg:flex lg:flex-col lg:gap-4">

        {/* User info card */}
        <div className="rounded-xl border border-primary/10 bg-gradient-to-b from-primary/5 to-primary/[0.03] p-5 text-center space-y-3">
          <Avatar className="h-16 w-16 mx-auto">
            <AvatarFallback className="bg-primary/15 text-primary text-xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5">
            <p className="font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
          {formattedMemberSince && (
            <>
              <Separator className="bg-border/60" />
              <p className="text-xs text-muted-foreground">
                {tCommon('memberSince')} {formattedMemberSince}
              </p>
            </>
          )}
        </div>

        {/* Vertical nav */}
        <nav aria-label="Account navigation" className="flex flex-col gap-0.5">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              className={[
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left min-h-11 touch-manipulation',
                activeSection === id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              ].join(' ')}
            >
              <Icon
                className={[
                  'h-4 w-4 shrink-0 transition-colors',
                  activeSection === id ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                ].join(' ')}
                aria-hidden="true"
              />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main content ── */}
      <main>
        {activeSection === 'profile' && (
          <ProfileForm data={data} email={email} locale={locale} />
        )}
        {activeSection === 'password' && <PasswordForm />}
        {activeSection === 'designs' && <DesignUpload />}
        {activeSection === 'orders' && <RecentOrders locale={locale} />}
      </main>
    </div>
  )
}

function getInitials(nameOrEmail: string): string {
  const parts = nameOrEmail.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return nameOrEmail.slice(0, 2).toUpperCase()
}

function AccountSkeleton() {
  return (
    <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-[260px_1fr] lg:gap-8">
      <div className="hidden lg:flex lg:flex-col lg:gap-4">
        <div className="rounded-xl border border-border/50 bg-muted/40 h-44 animate-pulse" />
        <div className="space-y-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-8 w-40 rounded-lg bg-muted/40 animate-pulse lg:hidden" />
        <div className="h-80 rounded-xl bg-muted/40 animate-pulse" />
      </div>
    </div>
  )
}
