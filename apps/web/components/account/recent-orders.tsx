'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { AlertCircle, ShoppingBag, ChevronDown, ChevronUp, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Locale } from '@/i18n'

interface Order {
  id: string
  status: string
  createdAt: string
  items: unknown[]
  checkoutDetails?: Record<string, unknown>
}

interface RecentOrdersResponse {
  orders: Order[]
}

interface RecentOrdersProps {
  locale: Locale
}

const STATUS_CHIPS = [
  { status: null, labelKey: 'orders.filterAll' },
  { status: 'pending', labelKey: 'orderStatus.pending' },
  { status: 'confirmed', labelKey: 'orderStatus.confirmed' },
  { status: 'completed', labelKey: 'orderStatus.completed' },
  { status: 'cancelled', labelKey: 'orderStatus.cancelled' },
] as const

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:   { bg: '#FEF3C7', text: '#92400E' },
  confirmed: { bg: '#D1FAE5', text: '#065F46' },
  completed: { bg: '#E5E7EB', text: '#374151' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B' },
}

export function RecentOrders({ locale }: RecentOrdersProps) {
  const t = useTranslations('account')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

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

  const orders = data?.orders ?? []
  const filtered = activeFilter ? orders.filter((o) => o.status === activeFilter) : orders

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-base">{t('ordersHeading')}</h2>
          <p className="text-sm text-muted-foreground">{t('ordersDescription')}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/${locale}/catalog`}>{t('ordersCta')}</Link>
        </Button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {STATUS_CHIPS.map((chip) => {
          const isActive = activeFilter === chip.status
          const label = t(chip.labelKey as Parameters<typeof t>[0])
          return (
            <button
              key={chip.status ?? 'all'}
              onClick={() => setActiveFilter(chip.status)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                isActive
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card text-muted-foreground border-border hover:bg-foreground hover:text-background hover:border-foreground'
              )}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {isLoading && <OrdersSkeleton />}
      {isError && (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{t('ordersError')}</span>
          </div>
          <Button size="sm" onClick={() => refetch()}>
            {t('retry')}
          </Button>
        </div>
      )}
      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState description={t('ordersEmpty')} />
      )}
      {!isLoading && !isError && filtered.length > 0 && (
        <ul className="flex flex-col gap-3">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} locale={locale} />
          ))}
        </ul>
      )}
    </div>
  )
}

function OrdersSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-muted/60" />
      ))}
    </div>
  )
}

function EmptyState({ description }: { description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
      <ShoppingBag className="h-7 w-7" />
      <p className="text-sm">{description}</p>
    </div>
  )
}

function OrderCard({ order, locale }: { order: Order; locale: Locale }) {
  const t = useTranslations('account')
  const [expanded, setExpanded] = useState(false)

  const formattedDate = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
    new Date(order.createdAt)
  )
  const itemCount = Array.isArray(order.items) ? order.items.length : 0
  const colors = STATUS_COLORS[order.status] ?? { bg: '#F3F4F6', text: '#374151' }
  const statusLabel = t(
    `orderStatus.${order.status as 'pending' | 'confirmed' | 'completed' | 'cancelled'}`,
    { defaultMessage: order.status }
  )

  return (
    <li className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Summary row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-xs font-mono text-muted-foreground">#{order.id.slice(0, 8)}</span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full w-fit"
              style={{ backgroundColor: colors.bg, color: colors.text }}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {formattedDate}
          </div>
          <span className="text-muted-foreground">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span className="font-medium text-foreground">{t('orderItemCount', { count: itemCount })}</span>
            <span>{t('orders.noPrice')}</span>
          </div>
          <div className="text-xs">{formattedDate}</div>
        </div>
      )}
    </li>
  )
}
