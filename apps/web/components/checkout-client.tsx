'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/stores/cart-store'
import { normalizeSupabaseImageUrl } from '@/lib/image-utils'

const orderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

type OrderFormData = z.infer<typeof orderSchema>

export function CheckoutClient() {
  const t = useTranslations('order')
  const tCart = useTranslations('cart')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const { items, clearCart } = useCartStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
  })

  const onSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true)

    try {
      const orderData = {
        items: items.map((item) => ({
          productId: item.productId,
          designId: item.designId,
          quantity: item.quantity,
        })),
        customer: data,
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        throw new Error('Failed to submit order')
      }

      clearCart()
      router.push('/order-success')
    } catch (error) {
      console.error('Error submitting order:', error)
      alert(t('error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">{tCart('empty')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form Section - Left/Middle */}
      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('customerInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {t('name')} <span className="text-destructive">*</span>
                </Label>
                <Input id="name" {...register('name')} />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  {t('email')} <span className="text-destructive">*</span>
                </Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('phone')}</Label>
                <Input id="phone" type="tel" {...register('phone')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t('address')}</Label>
                <Input id="address" {...register('address')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t('notes')}</Label>
                <Textarea id="notes" {...register('notes')} rows={4} />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? tCommon('loading') : t('submitOrder')}
          </Button>
        </form>
      </div>

      {/* Order Summary Section - Right */}
      <div className="lg:col-span-1">
        <Card className="sticky top-8">
          <CardHeader>
            <CardTitle>{tCart('orderSummary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={`${item.productId}-${item.designId}`} className="space-y-3 pb-4 border-b last:border-b-0 last:pb-0">
                  <div className="flex gap-3">
                    {item.productImageUrl && (
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary-50 to-accent shadow-sm">
                        <Image
                          src={normalizeSupabaseImageUrl(item.productImageUrl)}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-tight">{item.productName}</p>
                      {item.designName && (
                        <div className="mt-1.5 flex items-center gap-2">
                          {item.designImageUrl && (
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-primary/20 shadow-sm">
                              <Image
                                src={normalizeSupabaseImageUrl(item.designImageUrl)}
                                alt={item.designName}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {tCart('design')}
                            </p>
                            <p className="text-xs text-muted-foreground">{item.designName}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">x{item.quantity}</p>
                    </div>
                  </div>
                </div>
              ))}
              <Separator className="my-4" />
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">{tCart('total')}</span>
                <span className="text-lg font-semibold text-primary">
                  {items.reduce((sum, item) => sum + item.quantity, 0)} {items.reduce((sum, item) => sum + item.quantity, 0) === 1 ? tCart('item') : tCart('items')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

