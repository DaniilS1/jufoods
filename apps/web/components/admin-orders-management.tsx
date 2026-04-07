'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table'
import { format, parseISO } from 'date-fns'
import { de as deLocale, uk as ukLocale } from 'date-fns/locale'
import { useTranslations, useLocale } from 'next-intl'
import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/pagination'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { usePagination } from '@/hooks/use-pagination'
import { normalizeSupabaseImageUrl } from '@/lib/image-utils'
import { cn } from '@/lib/utils'
import Image from 'next/image'

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

function summarizeItems(items: unknown): string {
  if (!Array.isArray(items)) return '—'
  const n = items.length
  const qty = items.reduce((acc: number, row: { quantity?: number }) => acc + (row.quantity ?? 1), 0)
  return `${n} / ${qty}`
}

const statusVariant = (s: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
  if (s === 'completed') return 'secondary'
  if (s === 'cancelled') return 'destructive'
  if (s === 'confirmed') return 'default'
  return 'outline'
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
}

function parseLegacyNotes(
  notes: string | null,
  checkout: CheckoutShape
): { checkoutForDisplay: CheckoutShape; customerRemarks: string | null } {
  if (!notes?.trim()) {
    return { checkoutForDisplay: checkout, customerRemarks: null }
  }
  const raw = notes.trim()
  if (!raw.startsWith('{')) {
    return { checkoutForDisplay: checkout, customerRemarks: notes }
  }
  try {
    const j = JSON.parse(raw) as Record<string, unknown>
    const hasStructured = j.orderDetails != null || j.delivery != null
    if (hasStructured) {
      const od =
        typeof j.orderDetails === 'object' && j.orderDetails !== null
          ? (j.orderDetails as Record<string, unknown>)
          : {}
      const del =
        typeof j.delivery === 'object' && j.delivery !== null ? (j.delivery as Record<string, unknown>) : {}
      const remarksFromOd = typeof od.remarks === 'string' && od.remarks.trim() ? od.remarks : null
      return {
        checkoutForDisplay: {
          orderDetails: { ...(checkout.orderDetails ?? {}), ...od },
          delivery: { ...(checkout.delivery ?? {}), ...del },
          referralSource: (typeof j.referralSource === 'string' ? j.referralSource : checkout.referralSource),
          residenceCity:
            (typeof j.cityOfResidence === 'string' ? j.cityOfResidence : null) ??
            (typeof j.residenceCity === 'string' ? j.residenceCity : null) ??
            checkout.residenceCity,
        },
        customerRemarks: remarksFromOd,
      }
    }
  } catch {
    /* plain text mistaken start */
  }
  return { checkoutForDisplay: checkout, customerRemarks: notes }
}

function getDeliveryMode(row: AdminOrderRow): 'pickup' | 'delivery' | '' {
  const c = row.checkout_details
  if (!c || typeof c !== 'object') return ''
  const d = (c as CheckoutShape).delivery
  const v = d?.pickupOrDelivery
  if (v === 'pickup' || v === 'delivery') return v
  return ''
}

function formatDetailDate(iso: string | undefined, locale: string): string {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), 'PPp', { locale: locale === 'uk' ? ukLocale : deLocale })
  } catch {
    return String(iso)
  }
}

function OrderLineCard({
  line,
  locale,
}: {
  line: EnrichedOrderLine
  locale: string
}) {
  const t = useTranslations('admin.orders.detail')
  const productName =
    locale === 'uk' ? line.productName_uk || line.productName_de : line.productName_de || line.productName_uk
  const designName =
    locale === 'uk' ? line.designName_uk || line.designName_de : line.designName_de || line.designName_uk
  const productSrc = normalizeSupabaseImageUrl(line.productImageUrl)
  const designSrc = normalizeSupabaseImageUrl(line.designImageUrl)

  return (
    <li className="flex gap-3 rounded-lg border border-border/80 bg-muted/20 p-3">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
        <Image
          src={productSrc}
          alt={productName || t('productFallback')}
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-medium leading-tight text-foreground">{productName || line.productId || '—'}</p>
        {line.designId ? (
          <div className="flex items-start gap-2">
            <div className="relative size-10 shrink-0 overflow-hidden rounded border border-border bg-muted">
              <Image
                src={designSrc}
                alt={designName || t('designFallback')}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">{t('designLabel')}</p>
              <p className="text-sm text-foreground">{designName || line.designId}</p>
            </div>
          </div>
        ) : null}
        <p className="text-sm text-muted-foreground">
          {t('quantity')}: <span className="font-medium text-foreground">{line.quantity}</span>
        </p>
      </div>
    </li>
  )
}

function OrderDetailBody({
  order,
  enrichedItems,
  itemsLoading,
  locale,
}: {
  order: AdminOrderRow
  enrichedItems: EnrichedOrderLine[] | null
  itemsLoading: boolean
  locale: string
}) {
  const t = useTranslations('admin.orders.detail')
  const baseCheckout = (order.checkout_details && typeof order.checkout_details === 'object'
    ? order.checkout_details
    : {}) as CheckoutShape
  const { checkoutForDisplay, customerRemarks } = parseLegacyNotes(order.notes, baseCheckout)
  const od = checkoutForDisplay.orderDetails ?? {}
  const del = checkoutForDisplay.delivery ?? {}
  const ct = checkoutForDisplay.contact

  const modeLabel =
    del.pickupOrDelivery === 'delivery'
      ? t('modeDelivery')
      : del.pickupOrDelivery === 'pickup'
        ? t('modePickup')
        : '—'

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground">{t('orderId')}</span>
        <span className="break-all font-mono text-xs">{order.id}</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground">{t('customer')}</span>
          <span>{order.customer_name}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground">{t('email')}</span>
          <span className="break-all">{order.customer_email}</span>
        </div>
      </div>
      {ct && typeof ct === 'object' ? (
        <div className="flex flex-col gap-2 border-t pt-3">
          <span className="font-medium">{t('contactBlock')}</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {typeof ct.salutation === 'string' ? (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">{t('salutationLabel')}: </span>
                {ct.salutation === 'mrs' ? t('salutationMrs') : t('salutationMr')}
              </p>
            ) : null}
            {typeof ct.firstName === 'string' && ct.firstName ? (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">{t('firstNameLabel')}: </span>
                {ct.firstName}
              </p>
            ) : null}
            {typeof ct.lastName === 'string' && ct.lastName ? (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">{t('lastNameLabel')}: </span>
                {ct.lastName}
              </p>
            ) : null}
            {typeof ct.phone === 'string' && ct.phone ? (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">{t('phoneLabel')}: </span>
                {ct.phone}
              </p>
            ) : null}
          </div>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">{t('consentWhatsapp')}: </span>
            {ct.consentWhatsapp === true ? t('booleanYes') : t('booleanNo')}
            {' · '}
            <span className="font-medium text-foreground">{t('consentTelegram')}: </span>
            {ct.consentTelegram === true ? t('booleanYes') : t('booleanNo')}
          </p>
          {typeof ct.messengerPhone === 'string' && ct.messengerPhone ? (
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">{t('messengerPhoneLabel')}: </span>
              {ct.messengerPhone}
            </p>
          ) : null}
        </div>
      ) : null}
      {checkoutForDisplay.residenceCity ? (
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground">{t('residence')}</span>
          <span>{checkoutForDisplay.residenceCity}</span>
        </div>
      ) : null}
      {checkoutForDisplay.referralSource ? (
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground">{t('referral')}</span>
          <span>{checkoutForDisplay.referralSource}</span>
        </div>
      ) : null}
      <div className="flex flex-col gap-2 border-t pt-3">
        <span className="font-medium">{t('schedule')}</span>
        <p className="text-muted-foreground">
          {t('eventDate')}: {formatDetailDate(od.eventDate as string | undefined, locale)}
          {od.eventTime ? (
            <>
              {' '}
              · {t('eventTime')}: {String(od.eventTime)}
            </>
          ) : null}
        </p>
        <p className="text-muted-foreground">
          {t('celebration')}: {formatDetailDate(od.celebrationDate as string | undefined, locale)}
          {od.timeNeeded ? ` · ${String(od.timeNeeded)}` : ''}
        </p>
      </div>
      <div className="flex flex-col gap-2 border-t pt-3">
        <span className="font-medium">{t('delivery')}</span>
        <p className="text-muted-foreground">{modeLabel}</p>
        {del.pickupOrDelivery === 'delivery' ? (
          <p className="break-words text-muted-foreground">
            {[del.deliveryStreet, del.deliveryPostalCode, del.deliveryCity].filter(Boolean).join(', ') ||
              String(del.deliveryAddress ?? '')}
          </p>
        ) : del.pickupOrDelivery === 'pickup' && checkoutForDisplay.residenceCity ? (
          <p className="text-muted-foreground">{checkoutForDisplay.residenceCity}</p>
        ) : null}
      </div>
      {customerRemarks ? (
        <div className="flex flex-col gap-1 border-t pt-3">
          <span className="font-medium">{t('notes')}</span>
          <p className="whitespace-pre-wrap text-muted-foreground">{customerRemarks}</p>
        </div>
      ) : null}
      <div className="flex flex-col gap-3 border-t pt-3">
        <span className="font-medium">{t('items')}</span>
        {itemsLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            <span>{t('loadingItems')}</span>
          </div>
        ) : enrichedItems && enrichedItems.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {enrichedItems.map((line, i) => (
              <OrderLineCard key={`${line.productId}-${line.designId ?? 'x'}-${i}`} line={line} locale={locale} />
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">—</p>
        )}
      </div>
    </div>
  )
}

const PAGE_SIZE = 10

export function AdminOrdersManagement() {
  const t = useTranslations('admin.orders')
  const tStatus = useTranslations('account.orderStatus')
  const locale = useLocale()
  const dfLocale = locale === 'uk' ? ukLocale : deLocale

  const [data, setData] = useState<AdminOrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }])
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deliveryFilter, setDeliveryFilter] = useState<string>('all')
  const [notesFilter, setNotesFilter] = useState<string>('all')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })
  const [detailOrder, setDetailOrder] = useState<AdminOrderRow | null>(null)
  const [detailEnriched, setDetailEnriched] = useState<EnrichedOrderLine[] | null>(null)
  const [detailFetchLoading, setDetailFetchLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/orders', { cache: 'no-store' })
      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to load')
      }
      setData(payload.orders ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const id = detailOrder?.id
    if (!id) {
      setDetailEnriched(null)
      setDetailFetchLoading(false)
      return
    }
    let cancelled = false
    setDetailFetchLoading(true)
    setDetailEnriched(null)
    fetch(`/api/admin/orders/${id}`, { cache: 'no-store' })
      .then(async (res) => {
        const payload = await res.json()
        if (!res.ok) throw new Error(payload.error || 'Failed')
        return payload as { order: AdminOrderRow; enrichedItems: EnrichedOrderLine[] }
      })
      .then((payload) => {
        if (cancelled) return
        setDetailOrder((prev) => {
          if (!prev || prev.id !== payload.order?.id) return prev
          return payload.order
        })
        setDetailEnriched(payload.enrichedItems ?? [])
      })
      .catch(() => {
        if (!cancelled) setDetailEnriched([])
      })
      .finally(() => {
        if (!cancelled) setDetailFetchLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [detailOrder?.id])

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }, [statusFilter, deliveryFilter, notesFilter, globalFilter])

  const filteredData = useMemo(() => {
    const q = globalFilter.trim().toLowerCase()
    return data.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      if (deliveryFilter !== 'all') {
        const mode = getDeliveryMode(row)
        if (mode !== deliveryFilter) return false
      }
      if (notesFilter === 'with' && !row.notes?.trim()) return false
      if (notesFilter === 'without' && row.notes?.trim()) return false
      if (q) {
        const textMatch =
          row.customer_name.toLowerCase().includes(q) ||
          row.customer_email.toLowerCase().includes(q) ||
          row.id.toLowerCase().includes(q) ||
          row.status.toLowerCase().includes(q)
        if (!textMatch) return false
      }
      return true
    })
  }, [data, statusFilter, deliveryFilter, notesFilter, globalFilter])

  const markDone = useCallback(async (orderId: string) => {
    setUpdatingId(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload.error || 'Update failed')
      }
      setData((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'completed' } : o)))
      setDetailOrder((d) => (d?.id === orderId ? { ...d, status: 'completed' } : d))
    } catch (e) {
      console.error(e)
    } finally {
      setUpdatingId(null)
    }
  }, [])

  const columns = useMemo<ColumnDef<AdminOrderRow>[]>(
    () => [
      {
        accessorKey: 'id',
        header: t('columns.id'),
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.id.slice(0, 8).toUpperCase()}…</span>
        ),
        size: 100,
      },
      {
        accessorKey: 'created_at',
        header: t('columns.date'),
        cell: ({ row }) => {
          try {
            return format(parseISO(row.original.created_at), 'PPp', { locale: dfLocale })
          } catch {
            return row.original.created_at
          }
        },
        size: 200,
      },
      {
        accessorKey: 'customer_name',
        header: t('columns.customer'),
        size: 160,
      },
      {
        accessorKey: 'customer_email',
        header: t('columns.email'),
        size: 200,
      },
      {
        accessorKey: 'status',
        header: t('columns.status'),
        cell: ({ row }) => {
          const s = row.original.status
          return (
            <Badge variant={statusVariant(s)} className="capitalize">
              {tStatus(s as 'pending' | 'confirmed' | 'completed' | 'cancelled')}
            </Badge>
          )
        },
        size: 120,
      },
      {
        id: 'lines',
        header: t('columns.items'),
        cell: ({ row }) => summarizeItems(row.original.items),
        enableSorting: false,
        size: 100,
      },
      {
        id: 'done',
        header: () => <span className="sr-only">{t('columns.done')}</span>,
        cell: ({ row }) => {
          const isDone = row.original.status === 'completed'
          const isBusy = updatingId === row.original.id
          return (
            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={isDone ? 'secondary' : 'outline'}
                    size="icon"
                    className={cn(
                      'size-8 touch-manipulation rounded-lg',
                      isDone
                        ? 'border-1 border-primary/40 bg-primary/25 text-primary'
                        : 'border-1 border-primary/50 bg-muted/40 hover:bg-primary/10'
                    )}
                    disabled={isDone || isBusy}
                    onClick={() => {
                      if (!isDone) void markDone(row.original.id)
                    }}
                    aria-label={isDone ? t('doneLabel') : t('markDone')}
                  >
                    {isBusy ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Check className="size-4" strokeWidth={isDone ? 2.75 : 2} aria-hidden />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>{isDone ? t('doneLabel') : t('markDone')}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )
        },
        enableSorting: false,
        size: 56,
      },
    ],
    [t, tStatus, dfLocale, markDone, updatingId]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableSortingRemoval: false,
  })

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: table.getState().pagination.pageIndex + 1,
    totalPages: Math.max(1, table.getPageCount()),
    paginationItemsToDisplay: 2,
  })

  const totalFiltered = filteredData.length
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const from = totalFiltered === 0 ? 0 : pageIndex * pageSize + 1
  const to = totalFiltered === 0 ? 0 : Math.min((pageIndex + 1) * pageSize, totalFiltered)

  return (
    <TooltipProvider delayDuration={300}>
      <Card className="py-0">
        <CardHeader className="px-6 pb-4 pt-6">
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-muted-foreground px-6 py-8 text-center text-sm">{t('loading')}</p>
          ) : error ? (
            <p className="text-destructive px-6 py-4 text-sm">{error}</p>
          ) : data.length === 0 ? (
            <p className="text-muted-foreground px-6 py-8 text-center text-sm">{t('empty')}</p>
          ) : (
            <div className="w-full">
              <div className="border-b border-t">
                <div className="flex flex-col gap-3 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <span className="text-base font-semibold">{t('filterHeading')}</span>
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                        <div className="flex min-w-[9rem] flex-1 flex-col gap-1 sm:max-w-[12rem]">
                          <Label htmlFor="orders-filter-status" className="text-xs text-muted-foreground">
                            {t('filterStatus')}
                          </Label>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger id="orders-filter-status" className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem value="all">{t('filterAll')}</SelectItem>
                                <SelectItem value="pending">{tStatus('pending')}</SelectItem>
                                <SelectItem value="confirmed">{tStatus('confirmed')}</SelectItem>
                                <SelectItem value="completed">{tStatus('completed')}</SelectItem>
                                <SelectItem value="cancelled">{tStatus('cancelled')}</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex min-w-[9rem] flex-1 flex-col gap-1 sm:max-w-[12rem]">
                          <Label htmlFor="orders-filter-delivery" className="text-xs text-muted-foreground">
                            {t('filterDelivery')}
                          </Label>
                          <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
                            <SelectTrigger id="orders-filter-delivery" className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem value="all">{t('filterAll')}</SelectItem>
                                <SelectItem value="pickup">{t('filterPickup')}</SelectItem>
                                <SelectItem value="delivery">{t('filterShip')}</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex min-w-[9rem] flex-1 flex-col gap-1 sm:max-w-[12rem]">
                          <Label htmlFor="orders-filter-notes" className="text-xs text-muted-foreground">
                            {t('filterNotes')}
                          </Label>
                          <Select value={notesFilter} onValueChange={setNotesFilter}>
                            <SelectTrigger id="orders-filter-notes" className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem value="all">{t('filterAll')}</SelectItem>
                                <SelectItem value="with">{t('filterNotesWith')}</SelectItem>
                                <SelectItem value="without">{t('filterNotesWithout')}</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className="flex w-full shrink-0 flex-col gap-1 lg:max-w-xs lg:self-end">
                      <Label htmlFor="orders-search" className="text-xs text-muted-foreground">
                        {t('filterLabel')}
                      </Label>
                      <Input
                        id="orders-search"
                        placeholder={t('filterPlaceholder')}
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="h-14 border-t hover:bg-transparent">
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            style={{ width: header.getSize() > 0 ? `${header.getSize()}px` : undefined }}
                            className="text-muted-foreground first:pl-4 last:pr-4 last:text-right"
                          >
                            {header.isPlaceholder ? null : header.column.getCanSort() ? (
                              <div
                                className={cn(
                                  'flex h-full cursor-pointer items-center justify-between gap-2 select-none',
                                  !header.column.getCanSort() && 'cursor-default'
                                )}
                                onClick={header.column.getToggleSortingHandler()}
                                onKeyDown={(e) => {
                                  if (header.column.getCanSort() && (e.key === 'Enter' || e.key === ' ')) {
                                    e.preventDefault()
                                    header.column.getToggleSortingHandler()?.(e)
                                  }
                                }}
                                tabIndex={header.column.getCanSort() ? 0 : undefined}
                                role={header.column.getCanSort() ? 'button' : undefined}
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {header.column.getIsSorted() === 'asc' ? (
                                  <ChevronUp className="size-4 shrink-0 opacity-60" aria-hidden />
                                ) : header.column.getIsSorted() === 'desc' ? (
                                  <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
                                ) : null}
                              </div>
                            ) : (
                              flexRender(header.column.columnDef.header, header.getContext())
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map((row) => {
                        const isCompleted = row.original.status === 'completed'
                        return (
                          <TableRow
                            key={row.id}
                            className={cn(
                              'h-14 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                              isCompleted
                                ? 'border-l-4 border-l-primary bg-primary/8 hover:bg-primary/12'
                                : 'hover:bg-muted/50'
                            )}
                            tabIndex={0}
                            role="button"
                            aria-label={t('openDetails', { name: row.original.customer_name })}
                            onClick={() => setDetailOrder(row.original)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                setDetailOrder(row.original)
                              }
                            }}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell
                                key={cell.id}
                                className="h-14 first:pl-4 last:pr-4 last:text-right align-middle"
                              >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                          {t('noResults')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
                <p className="text-muted-foreground text-sm whitespace-nowrap" aria-live="polite">
                  {t('showingRange', { from, to, total: totalFiltered })}
                </p>
                <Pagination>
                  <PaginationContent className="flex-wrap justify-center gap-1">
                    <PaginationItem>
                      <Button
                        type="button"
                        variant="ghost"
                        className="touch-manipulation disabled:pointer-events-none disabled:opacity-50"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        aria-label={t('paginationPrevious')}
                      >
                        <ChevronLeft className="size-4" aria-hidden />
                        {t('paginationPrevious')}
                      </Button>
                    </PaginationItem>

                    {showLeftEllipsis ? (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : null}

                    {pages.map((page) => {
                      const isActive = page === table.getState().pagination.pageIndex + 1
                      return (
                        <PaginationItem key={page}>
                          <Button
                            type="button"
                            size="icon"
                            variant={isActive ? 'default' : 'ghost'}
                            className={cn(
                              'touch-manipulation',
                              !isActive &&
                                'bg-primary/10 text-primary hover:bg-primary/20 focus-visible:ring-primary/20'
                            )}
                            onClick={() => table.setPageIndex(page - 1)}
                            aria-current={isActive ? 'page' : undefined}
                          >
                            {page}
                          </Button>
                        </PaginationItem>
                      )
                    })}

                    {showRightEllipsis ? (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : null}

                    <PaginationItem>
                      <Button
                        type="button"
                        variant="ghost"
                        className="touch-manipulation disabled:pointer-events-none disabled:opacity-50"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        aria-label={t('paginationNext')}
                      >
                        {t('paginationNext')}
                        <ChevronRight className="size-4" aria-hidden />
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOrder !== null} onOpenChange={(open) => !open && setDetailOrder(null)}>
        <DialogContent className="flex max-h-[min(90dvh,800px)] w-[min(42rem,calc(100vw-2rem))] max-w-2xl flex-col gap-0 overflow-hidden rounded-lg p-0 sm:max-w-2xl">
          <DialogHeader className="border-b px-4 pb-3 pt-4 text-left">
            <DialogTitle>{t('detailTitle')}</DialogTitle>
            {detailOrder ? (
              <DialogDescription className="sr-only">
                {detailOrder.customer_name}, {detailOrder.id}
              </DialogDescription>
            ) : null}
          </DialogHeader>
          {detailOrder ? (
            <>
              <div className="max-h-[min(65dvh,560px)] overflow-y-auto overscroll-contain px-4 py-4">
                <OrderDetailBody
                  order={detailOrder}
                  enrichedItems={detailEnriched}
                  itemsLoading={detailFetchLoading}
                  locale={locale}
                />
              </div>
              <DialogFooter className="flex flex-col gap-2 border-t bg-muted/20 px-4 py-3 sm:flex-row sm:justify-end">
                {detailOrder.status !== 'completed' ? (
                  <Button
                    type="button"
                    variant="default"
                    className="w-full touch-manipulation border-2 border-[#5c4a4a] bg-[#735959] text-white hover:bg-[#635049] sm:w-auto"
                    disabled={updatingId === detailOrder.id}
                    onClick={() => void markDone(detailOrder.id)}
                  >
                    {updatingId === detailOrder.id ? (
                      <Loader2 className="animate-spin" data-icon="inline-start" />
                    ) : (
                      <Check data-icon="inline-start" />
                    )}
                    {t('markDone')}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full touch-manipulation sm:w-auto"
                  onClick={() => setDetailOrder(null)}
                >
                  {t('detailClose')}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
