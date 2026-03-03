'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCartStore } from '@/stores/cart-store'
import { normalizeSupabaseImageUrl } from '@/lib/image-utils'
import { cn } from '@/lib/utils'

// Updated schema with all 11 fields
const orderSchema = z.object({
  // Step 1: Customer Information
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  
  // Step 2: Order Details
  dessert: z.string().min(1, 'Dessert selection is required'),
  numberOfPeople: z.string().min(1, 'Number of people is required'),
  eventDate: z.string().min(1, 'Event date is required'),
  celebrationDate: z.string().min(1, 'Celebration date is required'),
  timeNeeded: z.string().min(1, 'Time needed is required'),
  
  // Step 3: Delivery Information
  pickupOrDelivery: z.enum(['pickup', 'delivery'], {
    required_error: 'Please select pickup or delivery',
  }),
  cityOfResidence: z.string().min(1, 'City of residence is required'),
  deliveryCity: z.string().optional(),
  deliveryPostalCode: z.string().optional(),
  
  // Step 4: Additional Information
  phoneOrSocial: z.string().min(1, 'Phone or social media is required'),
  referralSource: z.string().optional(),
  customDesignId: z.string().uuid().optional().or(z.literal('')),
})

type OrderFormData = z.infer<typeof orderSchema>

interface CustomDesignOption {
  id: string
  imageUrl: string
  notes?: string | null
  createdAt: string
}

const STEPS = [
  { id: 1, name: 'customerInfo', title: 'Customer Information' },
  { id: 2, name: 'orderDetails', title: 'Order Details' },
  { id: 3, name: 'deliveryInfo', title: 'Delivery Information' },
  { id: 4, name: 'additionalInfo', title: 'Additional Information' },
  { id: 5, name: 'review', title: 'Review & Submit' },
] as const

export function CheckoutClient() {
  const t = useTranslations('order')
  const tCart = useTranslations('cart')
  const tCommon = useTranslations('common')
  const tCustomDesign = useTranslations('order.customDesign')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const { items, clearCart } = useCartStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customDesigns, setCustomDesigns] = useState<CustomDesignOption[]>([])
  const [customDesignsLoading, setCustomDesignsLoading] = useState(true)
  const [customDesignsError, setCustomDesignsError] = useState<'unauthorized' | 'error' | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    mode: 'onChange',
  })

  const watchedValues = watch()
  const pickupOrDelivery = watch('pickupOrDelivery')
  const selectedCustomDesign = watchedValues.customDesignId
    ? customDesigns.find((design) => design.id === watchedValues.customDesignId)
    : null

  const handleSelectCustomDesign = (designId: string) => {
    const current = watchedValues.customDesignId
    const nextValue = current === designId ? '' : designId
    setValue('customDesignId', nextValue, { shouldDirty: true })
  }

  useEffect(() => {
    let isMounted = true
    const fetchDesigns = async () => {
      try {
        setCustomDesignsLoading(true)
        const response = await fetch('/api/account/designs', { cache: 'no-store' })
        if (!isMounted) return

        if (response.status === 401) {
          setCustomDesigns([])
          setCustomDesignsError('unauthorized')
          return
        }

        if (!response.ok) {
          throw new Error('Failed to load designs')
        }

        const payload = await response.json()
        setCustomDesigns(payload.designs ?? [])
        setCustomDesignsError(null)
      } catch (error) {
        if (isMounted) {
          setCustomDesignsError('error')
        }
      } finally {
        if (isMounted) {
          setCustomDesignsLoading(false)
        }
      }
    }

    fetchDesigns()

    return () => {
      isMounted = false
    }
  }, [])

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep)
    const isValid = await trigger(fieldsToValidate as any)
    
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getFieldsForStep = (step: number): (keyof OrderFormData)[] => {
    switch (step) {
      case 1:
        return ['fullName', 'email']
      case 2:
        return ['dessert', 'numberOfPeople', 'eventDate', 'celebrationDate', 'timeNeeded']
      case 3:
        return ['pickupOrDelivery', 'cityOfResidence', 'deliveryCity', 'deliveryPostalCode']
      case 4:
        return ['phoneOrSocial', 'referralSource']
      default:
        return []
    }
  }

  const onSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true)

    try {
      const orderData = {
        items: items.map((item) => ({
          productId: item.productId,
          designId: item.designId,
          quantity: item.quantity,
        })),
        customer: {
          fullName: data.fullName,
          email: data.email,
          phoneOrSocial: data.phoneOrSocial,
          cityOfResidence: data.cityOfResidence,
          referralSource: data.referralSource,
        },
        orderDetails: {
          dessert: data.dessert,
          numberOfPeople: data.numberOfPeople,
          eventDate: data.eventDate,
          celebrationDate: data.celebrationDate,
          timeNeeded: data.timeNeeded,
        },
        delivery: {
          pickupOrDelivery: data.pickupOrDelivery,
          deliveryCity: data.deliveryCity,
          deliveryPostalCode: data.deliveryPostalCode,
        },
        customDesignId: data.customDesignId && data.customDesignId.length > 0 ? data.customDesignId : null,
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
      const localePrefix = pathname?.split('/')[1] || locale
      router.push(`/${localePrefix}/order-success`)
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
      {/* Form Section */}
      <div className="lg:col-span-2 space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                    currentStep > step.id
                      ? 'bg-primary border-primary text-primary-foreground'
                      : currentStep === step.id
                        ? 'border-primary text-primary bg-primary/10'
                        : 'border-muted text-muted-foreground'
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>
                <span className="mt-2 text-xs font-medium text-center hidden sm:block">
                  {t(`steps.${step.name}`)}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2 transition-colors',
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Customer Information */}
          {currentStep === 1 && (
          <Card>
            <CardHeader>
                <CardTitle>{t('steps.customerInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                  <Label htmlFor="fullName">
                    {t('fields.fullName')} <span className="text-destructive">*</span>
                </Label>
                  <Input id="fullName" {...register('fullName')} placeholder={t('fields.fullNamePlaceholder')} />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                    {t('fields.email')} <span className="text-destructive">*</span>
                </Label>
                  <Input id="email" type="email" {...register('email')} placeholder={t('fields.emailPlaceholder')} />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Order Details */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('steps.orderDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dessert">
                    {t('fields.dessert')} <span className="text-destructive">*</span>
                  </Label>
                  <Input id="dessert" {...register('dessert')} placeholder={t('fields.dessertPlaceholder')} />
                  {errors.dessert && (
                    <p className="text-sm text-destructive">{errors.dessert.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfPeople">
                    {t('fields.numberOfPeople')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="numberOfPeople"
                    type="number"
                    {...register('numberOfPeople')}
                    placeholder={t('fields.numberOfPeoplePlaceholder')}
                  />
                  {errors.numberOfPeople && (
                    <p className="text-sm text-destructive">{errors.numberOfPeople.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventDate">
                      {t('fields.eventDate')} <span className="text-destructive">*</span>
                    </Label>
                    <Input id="eventDate" type="date" {...register('eventDate')} />
                    {errors.eventDate && (
                      <p className="text-sm text-destructive">{errors.eventDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="celebrationDate">
                      {t('fields.celebrationDate')} <span className="text-destructive">*</span>
                    </Label>
                    <Input id="celebrationDate" type="date" {...register('celebrationDate')} />
                    {errors.celebrationDate && (
                      <p className="text-sm text-destructive">{errors.celebrationDate.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeNeeded">
                    {t('fields.timeNeeded')} <span className="text-destructive">*</span>
                  </Label>
                  <Input id="timeNeeded" type="time" {...register('timeNeeded')} />
                  {errors.timeNeeded && (
                    <p className="text-sm text-destructive">{errors.timeNeeded.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Delivery Information */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('steps.deliveryInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    {t('fields.pickupOrDelivery')} <span className="text-destructive">*</span>
                  </Label>
                  <RadioGroup
                    value={pickupOrDelivery}
                    onValueChange={(value) => setValue('pickupOrDelivery', value as 'pickup' | 'delivery')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pickup" id="pickup" />
                      <Label htmlFor="pickup" className="font-normal cursor-pointer">
                        {t('fields.pickup')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="delivery" id="delivery" />
                      <Label htmlFor="delivery" className="font-normal cursor-pointer">
                        {t('fields.delivery')}
                      </Label>
                    </div>
                  </RadioGroup>
                  {errors.pickupOrDelivery && (
                    <p className="text-sm text-destructive">{errors.pickupOrDelivery.message}</p>
                  )}
                </div>

              <div className="space-y-2">
                  <Label htmlFor="cityOfResidence">
                    {t('fields.cityOfResidence')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cityOfResidence"
                    {...register('cityOfResidence')}
                    placeholder={t('fields.cityOfResidencePlaceholder')}
                  />
                  {errors.cityOfResidence && (
                    <p className="text-sm text-destructive">{errors.cityOfResidence.message}</p>
                  )}
                </div>

                {pickupOrDelivery === 'delivery' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryCity">{t('fields.deliveryCity')}</Label>
                      <Input
                        id="deliveryCity"
                        {...register('deliveryCity')}
                        placeholder={t('fields.deliveryCityPlaceholder')}
                      />
              </div>

              <div className="space-y-2">
                      <Label htmlFor="deliveryPostalCode">{t('fields.deliveryPostalCode')}</Label>
                      <Input
                        id="deliveryPostalCode"
                        {...register('deliveryPostalCode')}
                        placeholder={t('fields.deliveryPostalCodePlaceholder')}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Additional Information */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('steps.additionalInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <input type="hidden" {...register('customDesignId')} />
                <div className="space-y-3 rounded-xl border border-dashed border-border/60 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Label className="font-semibold">{tCustomDesign('title')}</Label>
                      <p className="text-sm text-muted-foreground">{tCustomDesign('description')}</p>
                    </div>
                    {watchedValues.customDesignId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setValue('customDesignId', '', { shouldDirty: true })}
                      >
                        {tCommon('remove')}
                      </Button>
                    )}
                  </div>
                  {customDesignsLoading && (
                    <div className="grid grid-cols-2 gap-3">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-24 animate-pulse rounded-xl bg-muted/60" />
                      ))}
                    </div>
                  )}
                  {!customDesignsLoading && customDesignsError === 'unauthorized' && (
                    <p className="text-sm text-muted-foreground">{tCustomDesign('loginPrompt')}</p>
                  )}
                  {!customDesignsLoading && customDesignsError === 'error' && (
                    <p className="text-sm text-destructive">{tCustomDesign('error')}</p>
                  )}
                  {!customDesignsLoading && !customDesignsError && customDesigns.length === 0 && (
                    <p className="text-sm text-muted-foreground">{tCustomDesign('empty')}</p>
                  )}
                  {!customDesignsLoading && !customDesignsError && customDesigns.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {customDesigns.map((design) => (
                        <button
                          key={design.id}
                          type="button"
                          onClick={() => handleSelectCustomDesign(design.id)}
                          className={cn(
                            'relative overflow-hidden rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                            watchedValues.customDesignId === design.id
                              ? 'border-primary ring-2 ring-primary/40'
                              : 'border-border hover:border-primary/60'
                          )}
                        >
                          <div className="relative h-28 w-full">
                            <Image
                              src={normalizeSupabaseImageUrl(design.imageUrl)}
                              alt={design.notes ?? 'Custom design'}
                              fill
                              className="object-cover"
                              sizes="200px"
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneOrSocial">
                    {t('fields.phoneOrSocial')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phoneOrSocial"
                    {...register('phoneOrSocial')}
                    placeholder={t('fields.phoneOrSocialPlaceholder')}
                  />
                  {errors.phoneOrSocial && (
                    <p className="text-sm text-destructive">{errors.phoneOrSocial.message}</p>
                  )}
              </div>

              <div className="space-y-2">
                  <Label htmlFor="referralSource">{t('fields.referralSource')}</Label>
                  <Select
                    value={watchedValues.referralSource}
                    onValueChange={(value) => setValue('referralSource', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('fields.referralSourcePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social-media">{t('fields.referralOptions.socialMedia')}</SelectItem>
                      <SelectItem value="friend">{t('fields.referralOptions.friend')}</SelectItem>
                      <SelectItem value="search">{t('fields.referralOptions.search')}</SelectItem>
                      <SelectItem value="other">{t('fields.referralOptions.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Review & Submit */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('steps.review')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold mb-2">{t('steps.customerInfo')}</h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>{t('fields.fullName')}:</strong> {watchedValues.fullName}</p>
                      <p><strong>{t('fields.email')}:</strong> {watchedValues.email}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2">{t('steps.orderDetails')}</h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>{t('fields.dessert')}:</strong> {watchedValues.dessert}</p>
                      <p><strong>{t('fields.numberOfPeople')}:</strong> {watchedValues.numberOfPeople}</p>
                      <p><strong>{t('fields.eventDate')}:</strong> {watchedValues.eventDate}</p>
                      <p><strong>{t('fields.celebrationDate')}:</strong> {watchedValues.celebrationDate}</p>
                      <p><strong>{t('fields.timeNeeded')}:</strong> {watchedValues.timeNeeded}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2">{t('steps.deliveryInfo')}</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>{t('fields.pickupOrDelivery')}:</strong>{' '}
                        {watchedValues.pickupOrDelivery === 'pickup' ? t('fields.pickup') : t('fields.delivery')}
                      </p>
                      <p><strong>{t('fields.cityOfResidence')}:</strong> {watchedValues.cityOfResidence}</p>
                      {watchedValues.pickupOrDelivery === 'delivery' && (
                        <>
                          <p><strong>{t('fields.deliveryCity')}:</strong> {watchedValues.deliveryCity || 'N/A'}</p>
                          <p>
                            <strong>{t('fields.deliveryPostalCode')}:</strong>{' '}
                            {watchedValues.deliveryPostalCode || 'N/A'}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2">{t('steps.additionalInfo')}</h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>{t('fields.phoneOrSocial')}:</strong> {watchedValues.phoneOrSocial}</p>
                      <p>
                        <strong>{t('fields.referralSource')}:</strong>{' '}
                        {watchedValues.referralSource
                          ? t(`fields.referralOptions.${watchedValues.referralSource}`)
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {selectedCustomDesign && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-2">{tCustomDesign('selectedLabel')}</h3>
                        <div className="relative h-40 w-full overflow-hidden rounded-xl border border-border">
                          <Image
                            src={normalizeSupabaseImageUrl(selectedCustomDesign.imageUrl)}
                            alt={selectedCustomDesign.notes ?? 'Custom design'}
                            fill
                            className="object-cover"
                            sizes="400px"
                          />
                        </div>
                      </div>
                    </>
                  )}
              </div>
            </CardContent>
          </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {tCommon('back') || 'Back'}
            </Button>

            {currentStep < STEPS.length ? (
              <Button type="button" onClick={nextStep}>
                {tCommon('next') || 'Next'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? tCommon('loading') : t('submitOrder')}
          </Button>
            )}
          </div>
        </form>
      </div>

      {/* Order Summary Section */}
      <div className="lg:col-span-1">
        <Card className="sticky top-8">
          <CardHeader>
            <CardTitle>{tCart('orderSummary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.designId}`}
                  className="space-y-3 pb-4 border-b last:border-b-0 last:pb-0"
                >
                  <div className="flex gap-3">
                    {item.productImageUrl && (
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={normalizeSupabaseImageUrl(item.productImageUrl)}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-tight">{item.productName}</p>
                      {item.designName && (
                        <div className="mt-1.5 flex items-center gap-2">
                          {item.designImageUrl && (
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                              <Image
                                src={normalizeSupabaseImageUrl(item.designImageUrl)}
                                alt={item.designName}
                                fill
                                className="object-cover"
                                sizes="40px"
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
                  {items.reduce((sum, item) => sum + item.quantity, 0)}{' '}
                  {items.reduce((sum, item) => sum + item.quantity, 0) === 1 ? tCart('item') : tCart('items')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
