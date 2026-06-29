'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { de as deLocale, uk as ukLocale } from 'date-fns/locale'
import { useTranslations, useLocale } from 'next-intl'
import { ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { normalizeSupabaseImageUrl } from '@/lib/image-utils'
import { cn } from '@/lib/utils'
import Image from 'next/image'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AdminOrderRow = {
  id: string
  created_at: string
  status: string
  customer_name: string
  customer_email: string
  customer_id: string | null
  items: unknown
  notes: string | null
  checkout_details: unknown
}

type CheckoutShape = {
  contact?: Record<string, unknown>
  orderDetails?: Record<string, unknown>
  delivery?: Record<string, unknown>
  referralSource?: string
  residenceCity?: string
}

export type EnrichedOrderLine = {
  productId: string
  designId: string | null
  quantity: number
  productName_de: string | null
  productName_uk: string | null
  designName_de: string | null
  designName_uk: string | null
  productImageUrl: string | null
  designImageUrl: string | null
  isCustom?: boolean
  customImageUrls?: string[] | null
  customDesignNote?: string | null
}

/** Detects a custom-design order from its raw items JSON (used for list/detail badges). */
function orderHasCustom(items: unknown): boolean {
  if (!Array.isArray(items)) return false
  return items.some((it) => {
    if (!it || typeof it !== 'object') return false
    const row = it as Record<string, unknown>
    const pid = (row.productId ?? row.product_id) as string | undefined
    const imgs = row.customImageUrls
    return (typeof pid === 'string' && pid.startsWith('custom')) || (Array.isArray(imgs) && imgs.length > 0)
  })
}

function CustomBadge() {
  const t = useTranslations('admin.orders')
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wider text-primary-foreground whitespace-nowrap">
      <Sparkles className="h-3 w-3" aria-hidden />
      {t('customBadge')}
    </span>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseLegacyNotes(
  notes: string | null,
  checkout: CheckoutShape
): { checkoutForDisplay: CheckoutShape; customerRemarks: string | null } {
  if (!notes?.trim()) return { checkoutForDisplay: checkout, customerRemarks: null }
  const raw = notes.trim()
  if (!raw.startsWith('{')) return { checkoutForDisplay: checkout, customerRemarks: notes }
  try {
    const j = JSON.parse(raw) as Record<string, unknown>
    const hasStructured = j.orderDetails != null || j.delivery != null
    if (hasStructured) {
      const od = typeof j.orderDetails === 'object' && j.orderDetails !== null ? (j.orderDetails as Record<string, unknown>) : {}
      const del = typeof j.delivery === 'object' && j.delivery !== null ? (j.delivery as Record<string, unknown>) : {}
      const remarksFromOd = typeof od.remarks === 'string' && od.remarks.trim() ? od.remarks : null
      return {
        checkoutForDisplay: {
          orderDetails: { ...(checkout.orderDetails ?? {}), ...od },
          delivery: { ...(checkout.delivery ?? {}), ...del },
          referralSource: typeof j.referralSource === 'string' ? j.referralSource : checkout.referralSource,
          residenceCity:
            (typeof j.cityOfResidence === 'string' ? j.cityOfResidence : null) ??
            (typeof j.residenceCity === 'string' ? j.residenceCity : null) ??
            checkout.residenceCity,
        },
        customerRemarks: remarksFromOd,
      }
    }
  } catch { /* plain text */ }
  return { checkoutForDisplay: checkout, customerRemarks: notes }
}

function formatDetailDate(iso: string | undefined, locale: string): string {
  if (!iso) return '—'
  try { return format(parseISO(iso), 'PPp', { locale: locale === 'uk' ? ukLocale : deLocale }) } catch { return String(iso) }
}

function shortDate(iso: string): string {
  try { return format(parseISO(iso), 'dd.MM.yy') } catch { return '—' }
}

const STATUS_OPTIONS = [
  { value: 'pending',   label: '🕐 Preis ausstehend' },
  { value: 'confirmed', label: '✅ Bestätigt' },
  { value: 'completed', label: '✔️ Abgeschlossen' },
  { value: 'cancelled', label: '✖ Storniert' },
]

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  pending:   { bg: 'bg-amber-100',  text: 'text-amber-800' },
  confirmed: { bg: 'bg-green-100',  text: 'text-green-800' },
  completed: { bg: 'bg-gray-100',   text: 'text-gray-600' },
  cancelled: { bg: 'bg-red-100',    text: 'text-red-700' },
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const tStatus = useTranslations('account.orderStatus')
  const cfg = STATUS_BADGE[status] ?? STATUS_BADGE.pending
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold leading-none whitespace-nowrap', cfg.bg, cfg.text)}>
      {tStatus(status as 'pending' | 'confirmed' | 'completed' | 'cancelled')}
    </span>
  )
}

// ─── OrderLineCard (preserved) ────────────────────────────────────────────────

function OrderLineCard({ line, locale }: { line: EnrichedOrderLine; locale: string }) {
  const t = useTranslations('admin.orders.detail')
  const productName = locale === 'uk' ? line.productName_uk || line.productName_de : line.productName_de || line.productName_uk
  const designName  = locale === 'uk' ? line.designName_uk  || line.designName_de  : line.designName_de  || line.designName_uk
  const customImages = line.isCustom && Array.isArray(line.customImageUrls) ? line.customImageUrls : []

  return (
    <li
      className={cn(
        'flex gap-3 rounded-lg border p-3',
        line.isCustom ? 'border-primary/40 bg-primary/[0.04]' : 'border-border/80 bg-muted/20'
      )}
    >
      <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
        <Image src={normalizeSupabaseImageUrl(line.productImageUrl)} alt={productName || t('productFallback')} fill className="object-cover" sizes="56px" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {line.isCustom && <CustomBadge />}
          <p className="font-medium text-sm leading-tight">{productName || (line.isCustom ? t('customProductFallback') : line.productId) || '—'}</p>
        </div>
        {line.designId && (
          <div className="flex items-center gap-2">
            <div className="relative size-9 shrink-0 overflow-hidden rounded border border-border bg-muted">
              <Image src={normalizeSupabaseImageUrl(line.designImageUrl)} alt={designName || t('designFallback')} fill className="object-cover" sizes="36px" />
            </div>
            <p className="text-xs text-muted-foreground">{designName || line.designId}</p>
          </div>
        )}

        {/* Custom uploaded design images */}
        {customImages.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">{t('customImages')}</p>
            <div className="flex flex-wrap gap-2">
              {customImages.map((url, idx) => {
                const full = normalizeSupabaseImageUrl(url)
                return (
                  <a
                    key={`${url}-${idx}`}
                    href={full}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative size-16 shrink-0 overflow-hidden rounded-md border border-primary/30 bg-muted transition-opacity hover:opacity-80"
                    title={t('openImage')}
                  >
                    <Image src={full} alt={`${t('customImages')} ${idx + 1}`} fill className="object-cover" sizes="64px" />
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* Custom design description note */}
        {line.isCustom && line.customDesignNote && (
          <div className="flex flex-col gap-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">{t('customNote')}</p>
            <p className="whitespace-pre-wrap text-xs text-foreground/90">{line.customDesignNote}</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">{t('quantity')}: <span className="font-medium text-foreground">{line.quantity}</span></p>
      </div>
    </li>
  )
}

// ─── OrderDetailBody (preserved) ─────────────────────────────────────────────

function OrderDetailBody({ order, enrichedItems, itemsLoading, locale }: {
  order: AdminOrderRow; enrichedItems: EnrichedOrderLine[] | null; itemsLoading: boolean; locale: string
}) {
  const t = useTranslations('admin.orders.detail')
  const baseCheckout = (order.checkout_details && typeof order.checkout_details === 'object' ? order.checkout_details : {}) as CheckoutShape
  const { checkoutForDisplay, customerRemarks } = parseLegacyNotes(order.notes, baseCheckout)
  const od = checkoutForDisplay.orderDetails ?? {}
  const del = checkoutForDisplay.delivery ?? {}
  const ct = checkoutForDisplay.contact
  const modeLabel = del.pickupOrDelivery === 'delivery' ? t('modeDelivery') : del.pickupOrDelivery === 'pickup' ? t('modePickup') : '—'

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground">{t('orderId')}</span>
        <span className="break-all font-mono text-xs">{order.id}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1"><span className="text-muted-foreground">{t('customer')}</span><span>{order.customer_name}</span></div>
        <div className="flex flex-col gap-1"><span className="text-muted-foreground">{t('email')}</span><span className="break-all">{order.customer_email}</span></div>
      </div>
      {ct && typeof ct === 'object' && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <span className="font-medium">{t('contactBlock')}</span>
          <div className="grid grid-cols-2 gap-2">
            {typeof ct.salutation === 'string' && <p className="text-muted-foreground"><span className="font-medium text-foreground">{t('salutationLabel')}: </span>{ct.salutation === 'mrs' ? t('salutationMrs') : t('salutationMr')}</p>}
            {typeof ct.firstName === 'string' && ct.firstName && <p className="text-muted-foreground"><span className="font-medium text-foreground">{t('firstNameLabel')}: </span>{ct.firstName}</p>}
            {typeof ct.lastName === 'string' && ct.lastName && <p className="text-muted-foreground"><span className="font-medium text-foreground">{t('lastNameLabel')}: </span>{ct.lastName}</p>}
            {typeof ct.phone === 'string' && ct.phone && <p className="text-muted-foreground"><span className="font-medium text-foreground">{t('phoneLabel')}: </span>{ct.phone}</p>}
          </div>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">{t('consentWhatsapp')}: </span>{ct.consentWhatsapp === true ? t('booleanYes') : t('booleanNo')}
            {' · '}
            <span className="font-medium text-foreground">{t('consentTelegram')}: </span>{ct.consentTelegram === true ? t('booleanYes') : t('booleanNo')}
          </p>
          {typeof ct.messengerPhone === 'string' && ct.messengerPhone && (
            <p className="text-muted-foreground"><span className="font-medium text-foreground">{t('messengerPhoneLabel')}: </span>{ct.messengerPhone}</p>
          )}
        </div>
      )}
      {checkoutForDisplay.residenceCity && <div className="flex flex-col gap-1"><span className="text-muted-foreground">{t('residence')}</span><span>{checkoutForDisplay.residenceCity}</span></div>}
      {checkoutForDisplay.referralSource && <div className="flex flex-col gap-1"><span className="text-muted-foreground">{t('referral')}</span><span>{checkoutForDisplay.referralSource}</span></div>}
      <div className="flex flex-col gap-2 border-t pt-3">
        <span className="font-medium">{t('schedule')}</span>
        <p className="text-muted-foreground">{t('eventDate')}: {formatDetailDate(od.eventDate as string | undefined, locale)}{od.eventTime ? ` · ${t('eventTime')}: ${String(od.eventTime)}` : ''}</p>
        <p className="text-muted-foreground">{t('celebration')}: {formatDetailDate(od.celebrationDate as string | undefined, locale)}{od.timeNeeded ? ` · ${String(od.timeNeeded)}` : ''}</p>
      </div>
      <div className="flex flex-col gap-2 border-t pt-3">
        <span className="font-medium">{t('delivery')}</span>
        <p className="text-muted-foreground">{modeLabel}</p>
        {del.pickupOrDelivery === 'delivery' && (
          <p className="break-words text-muted-foreground">{[del.deliveryStreet, del.deliveryPostalCode, del.deliveryCity].filter(Boolean).join(', ') || String(del.deliveryAddress ?? '')}</p>
        )}
      </div>
      {customerRemarks && (
        <div className="flex flex-col gap-1 border-t pt-3">
          <span className="font-medium">{t('notes')}</span>
          <p className="whitespace-pre-wrap text-muted-foreground">{customerRemarks}</p>
        </div>
      )}
      <div className="flex flex-col gap-3 border-t pt-3">
        <span className="font-medium">{t('items')}</span>
        {itemsLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /><span>{t('loadingItems')}</span></div>
        ) : enrichedItems && enrichedItems.length > 0 ? (
          <ul className="flex flex-col gap-3">{enrichedItems.map((line, i) => <OrderLineCard key={`${line.productId}-${i}`} line={line} locale={locale} />)}</ul>
        ) : (
          <p className="text-muted-foreground">—</p>
        )}
      </div>
    </div>
  )
}

// ─── OrderMasterCard ─────────────────────────────────────────────────────────

function OrderMasterCard({ order, isActive, onSelect, onStatusChange, updatingId }: {
  order: AdminOrderRow
  isActive: boolean
  onSelect: () => void
  onStatusChange: (status: string) => void
  updatingId: string | null
}) {
  const t = useTranslations('admin.orders')
  const [localNote, setLocalNote] = useState(order.notes ?? '')
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => { setLocalNote(order.notes ?? '') }, [order.notes])

  const checkout = (order.checkout_details && typeof order.checkout_details === 'object' ? order.checkout_details : {}) as CheckoutShape
  const contact = checkout.contact
  const phone = typeof contact?.phone === 'string' && contact.phone ? contact.phone : null

  async function handleSaveNote() {
    setSavingNote(true)
    try {
      await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: localNote }),
      })
    } finally {
      setSavingNote(false)
    }
  }

  return (
    <div className={cn('rounded-xl border overflow-hidden transition-colors', isActive ? 'border-secondary bg-secondary' : 'border-border bg-card hover:border-secondary/40')}>
      {/* Summary row — always visible, click to select/toggle */}
      <div className="p-3 cursor-pointer select-none" onClick={onSelect}>
        <div className="flex items-center justify-between mb-1.5">
          <span className={cn('text-[10px] font-bold tracking-wider', isActive ? 'text-white/50' : 'text-muted-foreground')}>
            {order.id.slice(0, 8).toUpperCase()}
          </span>
          <div className="flex items-center gap-1.5">
            {orderHasCustom(order.items) && <CustomBadge />}
            <StatusBadge status={order.status} />
            <span className={cn('lg:hidden', isActive ? 'text-white/60' : 'text-muted-foreground')}>
              {isActive ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </span>
          </div>
        </div>
        <p className={cn('text-sm font-semibold leading-snug', isActive ? 'text-white' : 'text-foreground')}>
          {order.customer_name}
        </p>
        <p className={cn('text-xs mt-0.5', isActive ? 'text-white/55' : 'text-muted-foreground')}>
          {shortDate(order.created_at)}
        </p>
      </div>

      {/* Mobile quick-action: status select always visible */}
      <div className="lg:hidden px-3 pb-2.5">
        <select
          value={order.status}
          disabled={updatingId === order.id}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full text-xs border border-border rounded-lg px-2 py-1.5 bg-background text-foreground outline-none cursor-pointer"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Mobile expanded: customer data + notes */}
      {isActive && (
        <div className="lg:hidden border-t border-border bg-background text-foreground px-3 py-3 flex flex-col gap-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('customerSection')}</p>
          {phone && <a href={`tel:${phone}`} className="text-xs text-primary font-medium">📞 {phone}</a>}
          {order.customer_email && <p className="text-xs text-foreground">{order.customer_email}</p>}
          <div className="mt-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('actions.note')}</p>
            <textarea
              className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-card resize-none h-[52px] outline-none"
              placeholder={t('actions.notePlaceholder')}
              value={localNote}
              onChange={(e) => setLocalNote(e.target.value)}
            />
            <button
              className="mt-1 text-[11px] font-semibold px-3 py-1 bg-secondary text-white rounded-lg disabled:opacity-60"
              onClick={handleSaveNote}
              disabled={savingNote}
            >
              {savingNote ? '…' : t('actions.save')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── DetailPanel (desktop) ────────────────────────────────────────────────────

function DetailPanel({ order, enrichedItems, enrichedLoading, adminNote, setAdminNote, onStatusChange, onSaveNote, savingNote, updatingId, locale }: {
  order: AdminOrderRow
  enrichedItems: EnrichedOrderLine[] | null
  enrichedLoading: boolean
  adminNote: string
  setAdminNote: (v: string) => void
  onStatusChange: (status: string) => void
  onSaveNote: () => void
  savingNote: boolean
  updatingId: string | null
  locale: string
}) {
  const t = useTranslations('admin.orders')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold tracking-wider text-muted-foreground">{order.id.slice(0, 8).toUpperCase()}</span>
          <StatusBadge status={order.status} />
          {orderHasCustom(order.items) && <CustomBadge />}
        </div>
        <h2 className="text-lg font-bold text-foreground leading-tight">{order.customer_name}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{order.customer_email} · {shortDate(order.created_at)}</p>
      </div>

      {/* Actions: status + notes */}
      <div className="px-6 py-4 border-b border-border grid grid-cols-2 gap-4 shrink-0">
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('actions.status')}</p>
          <select
            value={order.status}
            disabled={updatingId === order.id}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground outline-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('actions.note')}</p>
          <textarea
            className="flex-1 text-sm border border-border rounded-lg px-3 py-2 resize-none min-h-[70px] bg-background outline-none"
            placeholder={t('actions.notePlaceholder')}
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            className="self-end"
            onClick={onSaveNote}
            disabled={savingNote}
          >
            {savingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t('actions.save')}
          </Button>
        </div>
      </div>

      {/* Full checkout details */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <OrderDetailBody order={order} enrichedItems={enrichedItems} itemsLoading={enrichedLoading} locale={locale} />
      </div>
    </div>
  )
}

// ─── StatTile ─────────────────────────────────────────────────────────────────

function StatTile({ label, value, valueClass }: { label: string; value: number; valueClass?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 flex flex-col gap-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn('text-2xl font-bold text-foreground', valueClass)}>{value}</p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminOrdersManagement() {
  const t = useTranslations('admin.orders')
  const locale = useLocale()

  const [data, setData] = useState<AdminOrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  const [enrichedItems, setEnrichedItems] = useState<EnrichedOrderLine[] | null>(null)
  const [enrichedLoading, setEnrichedLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const activeOrder = useMemo(() => data.find((o) => o.id === activeOrderId) ?? null, [data, activeOrderId])

  // Load all orders
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/orders', { cache: 'no-store' })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Failed to load')
      setData(payload.orders ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Load enriched items when active order changes
  useEffect(() => {
    if (!activeOrderId) { setEnrichedItems(null); return }
    setAdminNote(activeOrder?.notes ?? '')
    let cancelled = false
    setEnrichedLoading(true)
    setEnrichedItems(null)
    fetch(`/api/admin/orders/${activeOrderId}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((payload: { order: AdminOrderRow; enrichedItems: EnrichedOrderLine[] }) => {
        if (cancelled) return
        setData((prev) => prev.map((o) => (o.id === payload.order?.id ? payload.order : o)))
        setEnrichedItems(payload.enrichedItems ?? [])
      })
      .catch(() => { if (!cancelled) setEnrichedItems([]) })
      .finally(() => { if (!cancelled) setEnrichedLoading(false) })
    return () => { cancelled = true }
  }, [activeOrderId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Stats computed from data
  const stats = useMemo(() => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return {
      open: data.filter((o) => o.status === 'pending').length,
      waiting: data.filter((o) => o.status === 'confirmed').length,
      week: data.filter((o) => new Date(o.created_at) >= weekAgo).length,
      total: data.length,
    }
  }, [data])

  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return data
    return data.filter((o) => o.status === statusFilter)
  }, [data, statusFilter])

  // Toggle order selection (desktop: show detail panel; mobile: expand card)
  function handleSelect(orderId: string) {
    setActiveOrderId((prev) => (prev === orderId ? null : orderId))
  }

  async function updateStatus(orderId: string, status: string) {
    setUpdatingId(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed')
      setData((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))
    } catch (e) {
      console.error(e)
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleSaveNote() {
    if (!activeOrderId) return
    setSavingNote(true)
    try {
      await fetch(`/api/admin/orders/${activeOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: adminNote }),
      })
      setData((prev) => prev.map((o) => (o.id === activeOrderId ? { ...o, notes: adminNote } : o)))
    } finally {
      setSavingNote(false)
    }
  }

  const filterOptions = [
    { value: 'all',       label: t('filterAll') },
    { value: 'pending',   label: STATUS_OPTIONS[0].label },
    { value: 'confirmed', label: STATUS_OPTIONS[1].label },
    { value: 'completed', label: STATUS_OPTIONS[2].label },
    { value: 'cancelled', label: STATUS_OPTIONS[3].label },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label={t('stats.open')}    value={stats.open}    valueClass="text-amber-700" />
        <StatTile label={t('stats.pending')} value={stats.waiting} valueClass="text-primary" />
        <StatTile label={t('stats.week')}    value={stats.week}    valueClass="text-green-700" />
        <StatTile label={t('stats.total')}   value={stats.total} />
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filterOptions.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
              statusFilter === f.value
                ? 'bg-secondary text-white'
                : 'bg-secondary/10 text-secondary hover:bg-secondary/20'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading / error */}
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">{t('loading')}</span>
        </div>
      )}
      {error && <p className="text-destructive text-sm px-1">{error}</p>}

      {/* Master + Detail */}
      {!loading && !error && (
        <div className="flex gap-4 items-start">
          {/* Master list */}
          <div className="w-full lg:w-[360px] lg:shrink-0 flex flex-col gap-2 lg:max-h-[calc(100vh-320px)] lg:overflow-y-auto lg:pr-1">
            {filteredData.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-8">{t('noResults')}</p>
            )}
            {filteredData.map((order) => (
              <OrderMasterCard
                key={order.id}
                order={order}
                isActive={activeOrderId === order.id}
                onSelect={() => handleSelect(order.id)}
                onStatusChange={(status) => updateStatus(order.id, status)}
                updatingId={updatingId}
              />
            ))}
          </div>

          {/* Detail panel — desktop only */}
          <div className="hidden lg:flex flex-1 flex-col bg-card border border-border rounded-xl min-h-[500px] max-h-[calc(100vh-320px)] sticky top-4 overflow-hidden">
            {activeOrder ? (
              <DetailPanel
                order={activeOrder}
                enrichedItems={enrichedItems}
                enrichedLoading={enrichedLoading}
                adminNote={adminNote}
                setAdminNote={setAdminNote}
                onStatusChange={(status) => updateStatus(activeOrder.id, status)}
                onSaveNote={handleSaveNote}
                savingNote={savingNote}
                updatingId={updatingId}
                locale={locale}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                {t('selectOrder')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
