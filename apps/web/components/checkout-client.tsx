'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Image from 'next/image'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, Check, CalendarIcon, MailIcon, MapPinIcon, UserIcon, PhoneIcon, CalendarDaysIcon, ClockIcon, FileTextIcon, TruckIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useCartStore } from '@/stores/cart-store'
import { normalizeSupabaseImageUrl } from '@/lib/image-utils'
import { cn } from '@/lib/utils'
import { DateTimePicker } from '@/components/date-time-picker'

const orderSchema = z.object({
  // Step 1: Customer Information
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),

  // Step 2: Order Details
  eventDate: z.date({ required_error: 'Event date is required' }),
  celebrationDate: z.date({ required_error: 'Celebration date is required' }),
  timeNeeded: z.string().min(1, 'Time needed is required'),
  remarks: z.string().optional(),

  // Step 3: Delivery Information
  pickupOrDelivery: z.enum(['pickup', 'delivery'], {
    required_error: 'Please select pickup or delivery',
  }),
  residenceCity: z.string().min(1, 'City of residence is required'),
  deliveryStreet: z.string().optional(),
  deliveryPostalCode: z.string().optional(),
  deliveryCity: z.string().optional(),

  // Step 4: Additional Information
  phoneOrSocial: z.string().min(1, 'Phone or social media is required'),
  referralSource: z.string().optional(),
})

type OrderFormData = z.infer<typeof orderSchema>

interface UserProfile {
  fullName: string
  email: string
}

const STEPS = [
  { id: 1, name: 'customerInfo', title: 'Customer Information' },
  { id: 2, name: 'orderDetails', title: 'Order Details' },
  { id: 3, name: 'deliveryInfo', title: 'Delivery Information' },
  { id: 4, name: 'additionalInfo', title: 'Additional Information' },
  { id: 5, name: 'review', title: 'Review & Submit' },
] as const

const REFERRAL_LABEL_MAP: Record<string, string> = {
  'social-media': 'socialMedia',
  friend: 'friend',
  search: 'search',
  other: 'other',
}

const today = new Date()
today.setHours(0, 0, 0, 0)

export function CheckoutClient({ userProfile }: { userProfile?: UserProfile | null }) {
  const t = useTranslations('order')
  const tCart = useTranslations('cart')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const { items, clearCart } = useCartStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
    trigger,
    reset,
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    mode: 'onChange',
  })

  const watchedValues = watch()
  const pickupOrDelivery = watch('pickupOrDelivery')

  // Auto-fill user profile when logged in
  useEffect(() => {
    if (userProfile) {
      reset((prev) => ({
        ...prev,
        fullName: userProfile.fullName || '',
        email: userProfile.email || '',
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile])

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep)
    const isValid = await trigger(fieldsToValidate as (keyof OrderFormData)[])
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
        return ['eventDate', 'celebrationDate', 'timeNeeded']
      case 3:
        return ['pickupOrDelivery', 'residenceCity']
      case 4:
        return ['phoneOrSocial', 'referralSource']
      default:
        return []
    }
  }

  const onSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true)
    try {
      const deliveryAddress =
        data.pickupOrDelivery === 'delivery'
          ? [data.deliveryStreet, data.deliveryPostalCode, data.deliveryCity]
              .filter(Boolean)
              .join(', ')
          : null

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
          residenceCity: data.residenceCity,
          referralSource: data.referralSource,
        },
        orderDetails: {
          eventDate: data.eventDate.toISOString(),
          celebrationDate: data.celebrationDate.toISOString(),
          timeNeeded: data.timeNeeded,
          remarks: data.remarks,
        },
        delivery: {
          pickupOrDelivery: data.pickupOrDelivery,
          deliveryStreet: data.deliveryStreet,
          deliveryPostalCode: data.deliveryPostalCode,
          deliveryCity: data.deliveryCity,
          deliveryAddress,
        },
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
      {/* Form Section */}
      <div className="lg:col-span-2 space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    'flex items-center justify-center size-8 sm:size-10 rounded-full border-2 transition-colors shrink-0',
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

        {/* Prevent native form submission on Enter so step 5 is never skipped */}
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
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
                  <Input
                    id="fullName"
                    {...register('fullName')}
                    placeholder={t('fields.fullNamePlaceholder')}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    {t('fields.email')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder={t('fields.emailPlaceholder')}
                  />
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
                {/* Event date — simple calendar popover */}
                <div className="space-y-2">
                  <Label>
                    {t('fields.eventDate')} <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="eventDate"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value
                              ? format(field.value, 'dd.MM.yyyy')
                              : t('fields.selectDate')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < today}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.eventDate && (
                    <p className="text-sm text-destructive">{errors.eventDate.message}</p>
                  )}
                </div>

                {/* Celebration date + delivery time — combined DateTimePicker */}
                <div className="space-y-2">
                  <Label>
                    {t('fields.celebrationDate')} &amp; {t('fields.timeNeeded')}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="celebrationDate"
                    control={control}
                    render={({ field: dateField }) => (
                      <Controller
                        name="timeNeeded"
                        control={control}
                        render={({ field: timeField }) => (
                          <DateTimePicker
                            date={dateField.value}
                            time={timeField.value ?? ''}
                            onDateChange={dateField.onChange}
                            onTimeChange={(t) =>
                              timeField.onChange(t)
                            }
                            locale={locale === 'uk' ? 'uk-UA' : 'de-DE'}
                            placeholder={t('fields.selectDate')}
                          />
                        )}
                      />
                    )}
                  />
                  {(errors.celebrationDate || errors.timeNeeded) && (
                    <p className="text-sm text-destructive">
                      {errors.celebrationDate?.message ?? errors.timeNeeded?.message}
                    </p>
                  )}
                </div>

                {/* Remarks */}
                <div className="space-y-2">
                  <Label htmlFor="remarks">{t('fields.remarks')}</Label>
                  <Textarea
                    id="remarks"
                    {...register('remarks')}
                    placeholder={t('fields.remarksPlaceholder')}
                    className="resize-none"
                    rows={3}
                  />
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
                    onValueChange={(value) =>
                      setValue('pickupOrDelivery', value as 'pickup' | 'delivery')
                    }
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
                  <Label htmlFor="residenceCity">
                    {t('fields.cityOfResidence')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="residenceCity"
                    {...register('residenceCity')}
                    placeholder={t('fields.cityOfResidencePlaceholder')}
                  />
                  {errors.residenceCity && (
                    <p className="text-sm text-destructive">{errors.residenceCity.message}</p>
                  )}
                </div>

                {pickupOrDelivery === 'delivery' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryStreet">
                        {t('fields.deliveryStreet')} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="deliveryStreet"
                        {...register('deliveryStreet')}
                        placeholder={t('fields.deliveryStreetPlaceholder')}
                      />
                      {errors.deliveryStreet && (
                        <p className="text-sm text-destructive">{errors.deliveryStreet.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="deliveryPostalCode">
                          {t('fields.deliveryPostalCode')}{' '}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="deliveryPostalCode"
                          {...register('deliveryPostalCode')}
                          placeholder={t('fields.deliveryPostalCodePlaceholder')}
                        />
                        {errors.deliveryPostalCode && (
                          <p className="text-sm text-destructive">
                            {errors.deliveryPostalCode.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deliveryCity">
                          {t('fields.deliveryCity')} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="deliveryCity"
                          {...register('deliveryCity')}
                          placeholder={t('fields.deliveryCityPlaceholder')}
                        />
                        {errors.deliveryCity && (
                          <p className="text-sm text-destructive">{errors.deliveryCity.message}</p>
                        )}
                      </div>
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
                      <SelectItem value="social-media">
                        {t('fields.referralOptions.socialMedia')}
                      </SelectItem>
                      <SelectItem value="friend">
                        {t('fields.referralOptions.friend')}
                      </SelectItem>
                      <SelectItem value="search">
                        {t('fields.referralOptions.search')}
                      </SelectItem>
                      <SelectItem value="other">
                        {t('fields.referralOptions.other')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Review & Submit — order-summary-04 layout */}
          {currentStep === 5 && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-2xl">{t('steps.review')}</CardTitle>
              </CardHeader>

              <CardContent className="grid gap-12 py-6 md:grid-cols-2 lg:grid-cols-2">
                {/* Column 1 — Customer & Contact */}
                <div className="space-y-8">
                  <h5 className="text-lg font-semibold text-muted-foreground">
                    {t('steps.customerInfo')}
                  </h5>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5">
                      <UserIcon className="size-5 shrink-0 text-muted-foreground" />
                      <Label className="text-sm font-medium text-muted-foreground">
                        {t('fields.fullName')}
                      </Label>
                    </div>
                    <p className="pl-8 text-foreground font-medium">
                      {watchedValues.fullName || '—'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5">
                      <MailIcon className="size-5 shrink-0 text-muted-foreground" />
                      <Label className="text-sm font-medium text-muted-foreground">
                        {t('fields.email')}
                      </Label>
                    </div>
                    <p className="pl-8 text-foreground font-medium">
                      {watchedValues.email || '—'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5">
                      <PhoneIcon className="size-5 shrink-0 text-muted-foreground" />
                      <Label className="text-sm font-medium text-muted-foreground">
                        {t('fields.phoneOrSocial')}
                      </Label>
                    </div>
                    <p className="pl-8 text-foreground font-medium">
                      {watchedValues.phoneOrSocial || '—'}
                    </p>
                  </div>
                </div>

                {/* Column 2 — Order & Delivery Details */}
                <div className="space-y-8">
                  <h5 className="text-lg font-semibold text-muted-foreground">
                    {t('steps.orderDetails')}
                  </h5>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5">
                      <CalendarDaysIcon className="size-5 shrink-0 text-muted-foreground" />
                      <Label className="text-sm font-medium text-muted-foreground">
                        {t('fields.eventDate')}
                      </Label>
                    </div>
                    <p className="pl-8 text-foreground font-medium">
                      {watchedValues.eventDate
                        ? format(watchedValues.eventDate, 'dd.MM.yyyy')
                        : '—'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5">
                      <ClockIcon className="size-5 shrink-0 text-muted-foreground" />
                      <Label className="text-sm font-medium text-muted-foreground">
                        {t('fields.celebrationDate')}
                      </Label>
                    </div>
                    <p className="pl-8 text-foreground font-medium">
                      {watchedValues.celebrationDate
                        ? format(watchedValues.celebrationDate, 'dd.MM.yyyy')
                        : '—'}
                      {watchedValues.timeNeeded ? ` · ${watchedValues.timeNeeded} Uhr` : ''}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2.5">
                      <TruckIcon className="size-5 shrink-0 text-muted-foreground" />
                      <Label className="text-sm font-medium text-muted-foreground">
                        {t('fields.pickupOrDelivery')}
                      </Label>
                    </div>
                    <div className="flex flex-col gap-2 pl-8">
                      <Badge
                        variant={
                          watchedValues.pickupOrDelivery === 'pickup' ? 'secondary' : 'default'
                        }
                        className="w-fit"
                      >
                        {watchedValues.pickupOrDelivery === 'pickup'
                          ? t('fields.pickup')
                          : t('fields.delivery')}
                      </Badge>
                      <p className="text-foreground font-medium text-sm">
                        {watchedValues.pickupOrDelivery === 'delivery'
                          ? [
                              watchedValues.deliveryStreet,
                              watchedValues.deliveryPostalCode && watchedValues.deliveryCity
                                ? `${watchedValues.deliveryPostalCode} ${watchedValues.deliveryCity}`
                                : watchedValues.deliveryCity ||
                                  watchedValues.deliveryPostalCode,
                            ]
                              .filter(Boolean)
                              .join(', ')
                          : watchedValues.residenceCity}
                      </p>
                    </div>
                  </div>

                  {watchedValues.remarks && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2.5">
                        <FileTextIcon className="size-5 shrink-0 text-muted-foreground" />
                        <Label className="text-sm font-medium text-muted-foreground">
                          {t('fields.remarks')}
                        </Label>
                      </div>
                      <p className="pl-8 text-foreground font-medium whitespace-pre-wrap">
                        {watchedValues.remarks}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="justify-between gap-6 border-t max-sm:flex-col max-sm:items-start">
                <p className="text-muted-foreground text-base">
                  {t('review.checkDetails')}
                </p>
              </CardFooter>
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
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(onSubmit)()}
              >
                {isSubmitting ? tCommon('loading') : t('submitOrder')}
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Order Summary Section */}
      <div className="lg:col-span-1">
        <Card className="lg:sticky lg:top-8">
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
                      <p className="font-semibold text-sm leading-tight truncate">
                        {item.productName}
                      </p>
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
                  {items.reduce((sum, item) => sum + item.quantity, 0) === 1
                    ? tCart('item')
                    : tCart('items')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
