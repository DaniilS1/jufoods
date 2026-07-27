'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { format, parseISO } from 'date-fns'
import { de as deLocale, uk as ukLocale } from 'date-fns/locale'
import { useTranslations, useLocale } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type AdminCustomerRow = {
  id: string
  display_email: string
  full_name: string
  order_count: number
  last_order_at: string
  first_order_at: string
  user_id: string | null
  phone_or_social: string | null
  residence_city: string | null
}

export function AdminCustomersManagement() {
  const t = useTranslations('admin.customers')
  const locale = useLocale()
  const dfLocale = locale === 'uk' ? ukLocale : deLocale

  const [data, setData] = useState<AdminCustomerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'last_order_at', desc: true }])
  const [globalFilter, setGlobalFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/customers', { cache: 'no-store' })
      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to load')
      }
      setData(payload.customers ?? [])
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

  const formatLastOrder = useCallback(
    (value: string) => {
      try {
        return format(parseISO(value), 'PPp', { locale: dfLocale })
      } catch {
        return value
      }
    },
    [dfLocale]
  )

  const columns = useMemo<ColumnDef<AdminCustomerRow>[]>(
    () => [
      {
        accessorKey: 'display_email',
        header: t('columns.email'),
        cell: ({ row }) => <span className="font-medium">{row.original.display_email}</span>,
      },
      {
        accessorKey: 'full_name',
        header: t('columns.name'),
      },
      {
        accessorKey: 'order_count',
        header: t('columns.orders'),
        cell: ({ row }) => row.original.order_count,
      },
      {
        accessorKey: 'last_order_at',
        header: t('columns.lastOrder'),
        cell: ({ row }) => {
          try {
            return format(parseISO(row.original.last_order_at), 'PPp', { locale: dfLocale })
          } catch {
            return row.original.last_order_at
          }
        },
      },
      {
        id: 'account',
        header: t('columns.account'),
        cell: ({ row }) =>
          row.original.user_id ? (
            <span className="text-muted-foreground text-xs font-mono truncate max-w-[100px] inline-block">
              {row.original.user_id.slice(0, 8)}…
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        enableSorting: false,
      },
      {
        accessorKey: 'phone_or_social',
        header: t('columns.contact'),
        cell: ({ row }) => row.original.phone_or_social || '—',
      },
      {
        accessorKey: 'residence_city',
        header: t('columns.city'),
        cell: ({ row }) => row.original.residence_city || '—',
      },
    ],
    [t, dfLocale]
  )

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).toLowerCase()
      if (!q) return true
      const o = row.original
      return (
        o.display_email.toLowerCase().includes(q) ||
        o.full_name.toLowerCase().includes(q) ||
        (o.phone_or_social?.toLowerCase().includes(q) ?? false) ||
        (o.residence_city?.toLowerCase().includes(q) ?? false) ||
        (o.user_id?.toLowerCase().includes(q) ?? false)
      )
    },
  })

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Input
          placeholder={t('filterPlaceholder')}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />

        {loading ? (
          <p className="text-muted-foreground text-sm py-8 text-center">{t('loading')}</p>
        ) : error ? (
          <p className="text-destructive text-sm py-4">{error}</p>
        ) : data.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">{t('empty')}</p>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-border rounded-md border">
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => {
                  const c = row.original
                  const contact = [c.phone_or_social, c.residence_city].filter(Boolean).join(' · ')
                  return (
                    <div key={row.id} className="p-4 space-y-1">
                      <p className="font-medium text-sm truncate">{c.display_email}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.full_name}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                        <span>
                          {t('columns.orders')}: {c.order_count}
                        </span>
                        <span>{formatLastOrder(c.last_order_at)}</span>
                      </div>
                      {contact && <p className="text-xs text-muted-foreground truncate">{contact}</p>}
                    </div>
                  )
                })
              ) : (
                <p className="text-muted-foreground text-sm py-8 text-center">{t('noResults')}</p>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id}>
                      {hg.headers.map((h) => (
                        <TableHead key={h.id}>
                          {h.isPlaceholder
                            ? null
                            : flexRender(h.column.columnDef.header, h.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
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
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
