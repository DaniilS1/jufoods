'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { ChevronDown, ChevronLeft, ChevronRight, Minus, Plus, Trash2, X } from 'lucide-react'
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
import { useRouter } from 'next/navigation'

interface CartItem {
  productId: string
  productSlug: string
  productName: string
  productImageUrl?: string
  designId: string
  designName: string
  designImageUrl?: string
  quantity: number
}

export function ShoppingCart() {
  const t = useTranslations('cart')
  const tOrder = useTranslations('order')
  const tCommon = useTranslations('common')
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
    router.push('/checkout')
  }

  return (
    <Dialog open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>
      <DialogContent className="max-h-[96vh] max-w-2xl bg-gradient-to-br from-primary-50 via-accent to-primary-50/50 flex flex-col p-0">
        <DialogHeader className="bg-white/60 backdrop-blur-sm border-b rounded-t-lg px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-foreground">{t('title')}</DialogTitle>
              {mounted && (
                <DialogDescription className="text-base mt-1">
                  {items.length} {items.length === 1 ? t('item') : t('items')}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground text-lg mb-6">{t('empty')}</p>
              <Button variant="outline" className="mt-4 border-primary/20 hover:bg-primary/10" onClick={closeCart}>
                {t('continueShopping')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const itemKey = `${item.productId}-${item.designId}`
                const isExpanded = expandedItems.has(itemKey)
                const hasDesign = !!item.designName

                return (
                  <div key={itemKey} className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    {/* Main Row */}
                    <div className="flex gap-4 p-4">
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary-50 to-accent shadow-sm">
                        <Image
                          src={normalizeSupabaseImageUrl(item.productImageUrl) || '/placeholder-cake.svg'}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                              {t('product')}
                            </p>
                            <p className="font-semibold text-base">{item.productName}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasDesign && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-primary/10"
                                onClick={() => toggleItem(itemKey)}
                              >
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform duration-200 ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`}
                                />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                              onClick={() => removeItem(item.productId, item.designId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full border-primary/20 hover:bg-primary/10"
                            onClick={() =>
                              updateQuantity(item.productId, item.designId, item.quantity - 1)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="h-7 w-12 flex items-center justify-center border border-primary/20 rounded-md bg-background text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full border-primary/20 hover:bg-primary/10"
                            onClick={() =>
                              updateQuantity(item.productId, item.designId, item.quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Subrow */}
                    {hasDesign && (
                      <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${
                          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="px-4 pb-4 pt-2 border-t border-primary/10 bg-white/40">
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                {t('design')}
                              </p>
                              <div className="flex items-center gap-3">
                                {item.designImageUrl && (
                                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-primary/20 shadow-sm">
                                    <Image
                                      src={normalizeSupabaseImageUrl(item.designImageUrl)}
                                      alt={item.designName}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-medium text-foreground">{item.designName}</p>
                                </div>
                              </div>
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
          <DialogFooter className="bg-white/80 backdrop-blur-sm border-t rounded-b-lg px-6 py-6 pt-6 mt-auto">
            <Separator className="mb-4 absolute left-0 right-0 top-0" />
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span className="text-foreground">{t('orderSummary')}</span>
                <span className="text-primary">{items.length} {items.length === 1 ? t('item') : t('items')}</span>
              </div>
              <div className="flex gap-3 justify-between">
                <Button variant="outline" className="flex-1 gap-2 border-primary/20 hover:bg-primary/10" onClick={closeCart}>
                <ChevronLeft className="h-4 w-4" /> {t('continueShopping')}
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90 shadow-md items-center justify-center gap-2" onClick={handleCheckout}>
                  {t('checkout')}<ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

