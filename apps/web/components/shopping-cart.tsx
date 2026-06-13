'use client'

import { useTranslations, useLocale } from 'next-intl'
import { format } from 'date-fns'
import { de, uk } from 'date-fns/locale'
import Image from 'next/image'
import { ChevronDown, ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart as ShoppingCartIcon, Trash2, X } from 'lucide-react'
import { normalizeSupabaseImageUrl } from '@/lib/image-utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/stores/cart-store'
import { useUIStore } from '@/stores/ui-store'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface CartItemDisplay {
  productId: string
  productSlug: string
  productName: string
  productImageUrl?: string
  designId: string
  designName: string
  designImageUrl?: string
  quantity: number
  personCount?: number
  deliveryDate?: string
}

export function ShoppingCart() {
  const t = useTranslations('cart')
  const tProduct = useTranslations('product')
  const tOrder = useTranslations('order')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const pathname = usePathname()
  const { isCartOpen, closeCart } = useUIStore()
  const { items, updateQuantity, removeItem, clearCart } = useCartStore()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleItem = (itemKey: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemKey)) {
        newSet.delete(itemKey)
      } else {
        newSet.add(itemKey)
      }
      return newSet
    })
  }

  const handleCheckout = () => {
    closeCart()
    const localePrefix = pathname?.split('/')[1] || locale
    router.push(`/${localePrefix}/checkout`)
  }

  return (
    <Dialog open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>
      <DialogContent className="max-h-[96vh] max-w-3xl bg-background flex flex-col p-0 gap-0 overflow-hidden overscroll-contain">
        <DialogHeader className="border-b px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="font-display text-2xl font-bold text-foreground">{t('title')}</DialogTitle>
              {mounted && (
                <DialogDescription className="text-base mt-2 text-muted-foreground">
                  {items.length} {items.length === 1 ? t('item') : t('items')}
                </DialogDescription>
              )}
            </div>
          
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="rounded-full bg-muted p-6 mb-6">
                <ShoppingCartIcon className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg font-medium mb-2">{t('empty')}</p>
              <Button
                variant="outline"
                className="mt-4 border-primary/20 hover:bg-primary/10"
                onClick={closeCart}
              >
                {t('continueShopping')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item: CartItemDisplay) => {
                const itemKey = `${item.productId}-${item.designId}`
                const isExpanded = expandedItems.has(itemKey)
                const hasDesign = !!item.designName

                return (
                  <div
                    key={itemKey}
                    className="group relative rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md active:shadow-md transition-all"
                  >
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={normalizeSupabaseImageUrl(item.productImageUrl) || '/placeholder-cake.svg'}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="112px"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex flex-1 flex-col gap-3 min-w-0">
                        <div className="flex items-start justify-between gap-4 min-w-0">
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              {t('product')}
                            </p>
                            <h3 className="font-semibold text-base leading-tight truncate">{item.productName}</h3>
                            {hasDesign && (
                              <button
                                onClick={() => toggleItem(itemKey)}
                                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mt-1"
                              >
                                <span>{t('flavour')}</span>
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform duration-200 ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            {hasDesign && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-11 w-11"
                                onClick={() => toggleItem(itemKey)}
                              >
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform duration-200 ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`}
                                />
                                <span className="sr-only">Toggle flavour details</span>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-11 w-11 text-destructive hover:text-destructive hover:bg-destructive/10 active:bg-destructive/10"
                              onClick={() => removeItem(item.productId, item.designId)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remove item</span>
                            </Button>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                              className="h-11 w-11 rounded-lg touch-manipulation"
                              onClick={() => updateQuantity(item.productId, item.designId, item.quantity - 1)}
                          >
                              <Minus className="h-4 w-4" />
                              <span className="sr-only">Decrease quantity</span>
                          </Button>
                            <span className="w-12 text-center text-sm font-semibold">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                              className="h-11 w-11 rounded-lg touch-manipulation"
                              onClick={() => updateQuantity(item.productId, item.designId, item.quantity + 1)}
                          >
                              <Plus className="h-4 w-4" />
                              <span className="sr-only">Increase quantity</span>
                          </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Design Details */}
                    {hasDesign && (
                      <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${
                          isExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="pt-4 border-t border-border">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                            {t('flavour')}
                          </p>
                          <div className="flex items-center gap-4">
                                {item.designImageUrl && (
                              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                                    <Image
                                      src={normalizeSupabaseImageUrl(item.designImageUrl)}
                                      alt={item.designName}
                                      fill
                                      className="object-cover"
                                  sizes="96px"
                                    />
                                  </div>
                                )}
                            <div className="flex-1 space-y-1">
                              <p className="font-medium text-foreground">{item.designName}</p>
                              {(item.deliveryDate || item.personCount) && (
                                <div className="text-sm text-muted-foreground">
                                  {item.deliveryDate && (
                                    <p>
                                      {tProduct('deliveryDate')}:{' '}
                                      {format(new Date(item.deliveryDate + 'T12:00:00'), 'PPP', {
                                        locale: locale === 'uk' ? uk : de,
                                      })}
                                    </p>
                                  )}
                                  {item.personCount != null && (
                                    <p>
                                      {tProduct('personCount')}: {item.personCount}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <DialogFooter className="border-t bg-muted/30 px-4 sm:px-6 py-5">
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-foreground">{t('orderSummary')}</span>
                <span className="text-lg font-bold text-primary">
                  {items.reduce((sum, item) => sum + item.quantity, 0)}{' '}
                  {items.reduce((sum, item) => sum + item.quantity, 0) === 1 ? t('item') : t('items')}
                </span>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={closeCart}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  {t('continueShopping')}
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90 shadow-md"
                  onClick={handleCheckout}
                >
                  {t('checkout')}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

