'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { AlertCircle, ShoppingBag, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n'

interface RecentOrdersResponse {
  orders: Array<{
    id: string
    status: string
    createdAt: string
    items: unknown[]
  }>
}

interface RecentOrdersProps {
  locale: Locale
}

export function RecentOrders({ locale }: RecentOrdersProps) {
  const t = useTranslations('account')
  const { data, isLoading, isError, refetch } = useQuery<RecentOrdersResponse>({
    queryKey: ['account-orders'],
    queryFn: async () => {
      const response = await fetch('/api/account/orders', { cache: 'no-store' })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Failed to load orders')
      }
      return response.json()
    },
  })

  return (
    <Card className="border border-primary/10 shadow-sm">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{t('ordersHeading')}</CardTitle>
          <CardDescription>{t('ordersDescription')}</CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/${locale}`}>{t('ordersCta')}</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && <OrdersSkeleton />}
        {isError && (
          <div className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{t('ordersError')}</span>
            </div>
            <Button size="sm" onClick={() => refetch()}>
              {t('retry')}
            </Button>
          </div>
        )}
        {!isLoading && !isError && data && data.orders.length === 0 && (
          <EmptyState description={t('ordersEmpty')} />
        )}
        {!isLoading && !isError && data && data.orders.length > 0 && (
          <ul className="space-y-3">
            {data.orders.map((order) => (
              <OrderListItem key={order.id} order={order} locale={locale} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function OrdersSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-24 w-full animate-pulse rounded-xl bg-muted/60" />
      ))}
    </div>
  )
}

function EmptyState({ description }: { description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 p-6 text-center text-muted-foreground">
      <ShoppingBag className="h-6 w-6" />
      <p className="text-sm">{description}</p>
    </div>
  )
}

function OrderListItem({
  order,
  locale,
}: {
  order: RecentOrdersResponse['orders'][number]
  locale: Locale
}) {
  const t = useTranslations('account')
  const formattedDate = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(order.createdAt))

  const itemCount = Array.isArray(order.items) ? order.items.length : 0
  const itemLabel = t('orderItemCount', { count: itemCount })

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border/50 p-4 transition hover:border-primary/50">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">#{order.id.slice(0, 8)}</p>
        <StatusBadge status={order.status} />
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {formattedDate}
        </span>
        <span>{itemLabel}</span>
      </div>
    </li>
  )
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('account')
  const statusLabel = t(`orderStatus.${status as 'pending' | 'confirmed' | 'completed' | 'cancelled'}`, {
    defaultMessage: status,
  })

  const colorMap: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
    cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200',
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${colorMap[status] || 'bg-muted text-foreground'}`}
    >
      {statusLabel}
    </span>
  )
}

