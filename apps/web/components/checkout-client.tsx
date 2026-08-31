'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Image from 'next/image'
import { format } from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  CalendarIcon,
  MailIcon,
  UserIcon,
  PhoneIcon,
  CalendarDaysIcon,
  ClockIcon,
  FileTextIcon,
  TruckIcon,
  Info,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Stepper, StepperNav, StepperItem, StepperIndicator, StepperSeparator, StepperTitle } from '@/components/ui/stepper'
import { useCartStore } from '@/stores/cart-store'
import { normalizeSupabaseImageUrl } from '@/lib/image-utils'
import { cn } from '@/lib/utils'
import { DateTimePicker } from '@/components/date-time-picker'
import { PhoneInput } from '@/components/phone-input'
import {
  CHECKOUT_PHONE_DIAL_ORDER,
  defaultDialCodeForLocale,
  formatInternationalPhone,
} from '@/lib/phone-input-utils'

const PHONE_DIAL_LABEL_KEY: Record<string, string> = {
  '+49': 'dialDE',
  '+380': 'dialUA',
  '+43': 'dialAT',
  '+41': 'dialCH',
  '+48': 'dialPL',
  '+31': 'dialNL',
  '+33': 'dialFR',
  '+1': 'dialUS',
  '+44': 'dialGB',
}

function buildOrderSchema(tr: (key: string) => string) {
  const req = tr('validation.required')
  return z
    .object({
      salutation: z.enum(['mr', 'mrs']),
      firstName: z.string().min(1, { message: req }),
      lastName: z.string().min(1, { message: req }),
      email: z.string().email({ message: tr('validation.invalidEmail') }),
      eventDate: z.date({ required_error: req }),
      eventTime: z.string().min(1, { message: req }),
      celebrationDate: z.date({ required_error: req }),
      timeNeeded: z.string().min(1, { message: req }),
      remarks: z.string().optional(),
      pickupOrDelivery: z.enum(['pickup', 'delivery'], { required_error: req }),
      residenceCity: z.string().min(1, { message: req }),
      deliveryStreet: z.string().optional(),
      deliveryPostalCode: z.string().optional(),
      deliveryCity: z.string().optional(),
      phoneDialCode: z.string().min(1, { message: req }),
      phoneLocal: z.string().min(1, { message: req }),
      messengerPhoneDialCode: z.string().optional(),
      messengerPhoneLocal: z.string().optional(),
      consentWhatsapp: z.boolean(),
      consentTelegram: z.boolean(),
      referralSource: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.pickupOrDelivery === 'delivery') {
        if (!data.deliveryStreet?.trim()) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: req, path: ['deliveryStreet'] })
        }
        if (!data.deliveryPostalCode?.trim()) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: req, path: ['deliveryPostalCode'] })
        }
        if (!data.deliveryCity?.trim()) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: req, path: ['deliveryCity'] })
        }
      }
      const digits = data.phoneLocal.replace(/\D/g, '')
      if (digits.length > 0 && digits.length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: tr('validation.phoneTooShort'),
          path: ['phoneLocal'],
        })
      }
      if (
        (data.consentWhatsapp || data.consentTelegram) &&
        data.messengerPhoneLocal?.trim()
      ) {
        const md = data.messengerPhoneLocal.replace(/\D/g, '')
        if (md.length > 0 && md.length < 6) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: tr('validation.phoneTooShort'),
            path: ['messengerPhoneLocal'],
          })
        }
      }
    })
}

export type OrderFormData = z.infer<ReturnType<typeof buildOrderSchema>>

interface UserProfile {
  firstName: string
  lastName: string
  email: string
}

const TOTAL_INTERACTIVE_STEPS = 2

const ANGABEN_FIELDS: (keyof OrderFormData)[] = [
  'salutation',
  'firstName',
  'lastName',
  'email',
  'eventDate',
  'eventTime',
  'celebrationDate',
  'timeNeeded',
  'pickupOrDelivery',
  'residenceCity',
  'deliveryStreet',
  'deliveryPostalCode',
  'deliveryCity',
  'phoneDialCode',
  'phoneLocal',
  'consentWhatsapp',
  'consentTelegram',
  'messengerPhoneDialCode',
  'messengerPhoneLocal',
  'referralSource',
]

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
  const [showValidationSummary, setShowValidationSummary] = useState(false)

  const orderSchema = useMemo(() => buildOrderSchema((key) => t(key as never)), [t])

  const stepperSteps = useMemo(
    () => [
      { id: 'angaben', title: t('steps.groupInfo') },
      { id: 'uebersicht', title: t('steps.groupReview') },
      { id: 'bestaetigt', title: t('steps.groupConfirmed') },
    ],
    [t]
  )

  const defaultFormValues = useMemo(
    (): Partial<OrderFormData> => ({
      salutation: 'mr',
      consentWhatsapp: false,
      consentTelegram: false,
      eventTime: '',
      timeNeeded: '',
      phoneDialCode: defaultDialCodeForLocale(locale),
      phoneLocal: '',
      messengerPhoneDialCode: '',
      messengerPhoneLocal: '',
    }),
    [locale]
  )

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    getValues,
    setValue,
    trigger,
    reset,
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    mode: 'onChange',
    defaultValues: defaultFormValues as OrderFormData,
  })

  const watchedValues = watch()
  const pickupOrDelivery = watch('pickupOrDelivery')
  const consentWhatsapp = watch('consentWhatsapp')
  const consentTelegram = watch('consentTelegram')
  const phoneDialCodeW = watch('phoneDialCode')
  const showMessengerAlternateField = consentWhatsapp || consentTelegram

  const phoneDialOptions = useMemo(
    () =>
      CHECKOUT_PHONE_DIAL_ORDER.map((code) => ({
        value: code,
        label: t(`fields.${PHONE_DIAL_LABEL_KEY[code]}` as never),
      })),
    [t]
  )

  // Auto-fill user profile when logged in
  useEffect(() => {
    if (userProfile) {
      reset((prev) => ({
        ...prev,
        ...defaultFormValues,
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: userProfile.email || '',
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile])

  useEffect(() => {
    if (!consentWhatsapp && !consentTelegram) {
      setValue('messengerPhoneDialCode', '')
      setValue('messengerPhoneLocal', '')
    }
  }, [consentWhatsapp, consentTelegram, setValue])

  useEffect(() => {
    if (!showMessengerAlternateField) return
    const current = getValues('messengerPhoneDialCode')
    if (!current?.trim()) {
      setValue(
        'messengerPhoneDialCode',
        phoneDialCodeW || defaultDialCodeForLocale(locale),
        { shouldDirty: false }
      )
    }
  }, [showMessengerAlternateField, phoneDialCodeW, getValues, setValue, locale])

  const nextStep = async () => {
    const isValid = await trigger(currentStep === 1 ? ANGABEN_FIELDS : [])
    setShowValidationSummary(!isValid)
    if (isValid && currentStep < TOTAL_INTERACTIVE_STEPS) {
      setCurrentStep(currentStep + 1)
    }
  }

  const fieldErrorLabel = (key: keyof OrderFormData): string => {
    switch (key) {
      case 'firstName':
        return t('fields.firstName')
      case 'lastName':
        return t('fields.lastName')
      case 'email':
        return t('fields.email')
      case 'salutation':
        return t('fields.salutation')
      case 'eventDate':
      case 'eventTime':
        return t('fields.eventDateTime')
      case 'celebrationDate':
      case 'timeNeeded':
        return t('fields.celebrationDateTime')
      case 'pickupOrDelivery':
        return t('fields.pickupOrDelivery')
      case 'residenceCity':
        return t('fields.cityOfResidence')
      case 'deliveryStreet':
        return t('fields.deliveryStreet')
      case 'deliveryPostalCode':
        return t('fields.deliveryPostalCode')
      case 'deliveryCity':
        return t('fields.deliveryCity')
      case 'phoneDialCode':
      case 'phoneLocal':
        return t('fields.phone')
      case 'messengerPhoneDialCode':
      case 'messengerPhoneLocal':
        return t('contactConsent.messengerAlternateLabel')
      default:
        return key
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
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

      const mainPhone = formatInternationalPhone(data.phoneDialCode, data.phoneLocal)
      const messengerLocalTrimmed = data.messengerPhoneLocal?.trim() ?? ''
      const messengerDial =
        data.messengerPhoneDialCode?.trim() || data.phoneDialCode.trim() || defaultDialCodeForLocale(locale)
      const messengerFormatted =
        (data.consentWhatsapp || data.consentTelegram) && messengerLocalTrimmed
          ? formatInternationalPhone(messengerDial, messengerLocalTrimmed)
          : null

      const orderData = {
        locale,
        items: items.map((item) => ({
          productId: item.productId,
          designId: item.designId,
          quantity: item.quantity,
          ...(item.deliveryDate ? { deliveryDate: item.deliveryDate } : {}),
          ...(item.personCount != null ? { personCount: item.personCount } : {}),
          ...(item.customImageUrls?.length ? { customImageUrls: item.customImageUrls } : {}),
          ...(item.customDesignNote ? { customDesignNote: item.customDesignNote } : {}),
          ...(item.productId.startsWith('custom') ? { productName: item.productName } : {}),
        })),
        customer: {
          salutation: data.salutation,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          fullName: `${data.firstName.trim()} ${data.lastName.trim()}`.trim(),
          email: data.email,
          phone: mainPhone,
          consentWhatsapp: data.consentWhatsapp,
          consentTelegram: data.consentTelegram,
          messengerSameAsPhone:
            !data.consentWhatsapp && !data.consentTelegram
              ? true
              : !messengerLocalTrimmed,
          messengerPhone: messengerFormatted,
          residenceCity: data.residenceCity,
          referralSource: data.referralSource,
        },
        orderDetails: {
          eventDate: data.eventDate.toISOString(),
          eventTime: data.eventTime,
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
      setCurrentStep(3)
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
        <Stepper
          steps={stepperSteps}
          value={currentStep === 1 ? 'angaben' : currentStep === 2 ? 'uebersicht' : 'bestaetigt'}
          indicators={{ completed: <Check className="h-4 w-4" /> }}
        >
          <StepperNav>
            {stepperSteps.map((step, index) => (
              <StepperItem key={step.id} stepId={step.id} className="relative flex-1">
                <div className="flex flex-col items-center gap-2">
                  <StepperIndicator className="size-8 sm:size-10 rounded-full">
                    {index + 1}
                  </StepperIndicator>
                  <StepperTitle className="text-xs font-medium text-center hidden sm:block">
                    {step.title}
                  </StepperTitle>
                </div>
                {index < stepperSteps.length - 1 && (
                  <StepperSeparator className="absolute inset-x-0 top-4 sm:top-5 right-[calc(-50%+20px)] left-[calc(50%+20px)]" />
                )}
              </StepperItem>
            ))}
          </StepperNav>
        </Stepper>

        {showValidationSummary && Object.keys(errors).length > 0 && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">{t('validation.summaryTitle')}</p>
              <ul className="mt-1 list-disc pl-4">
                {[...new Set(Object.keys(errors).map((key) => fieldErrorLabel(key as keyof OrderFormData)))].map(
                  (label) => (
                    <li key={label}>{label}</li>
                  )
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Prevent native form submission on Enter so the review step is never skipped */}
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {/* Step 1: Angaben — Kundendaten, Bestelldetails, Lieferung, Zusatzinfo als gestapelte Karten */}
          {currentStep === 1 && (
            <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">{t('steps.customerInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>
                    {t('fields.salutation')} <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="salutation"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex flex-wrap items-center gap-x-6 gap-y-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <RadioGroupItem value="mr" id="salutation-mr" className="shrink-0" />
                          <Label htmlFor="salutation-mr" className="cursor-pointer font-normal leading-none">
                            {t('fields.salutationMr')}
                          </Label>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <RadioGroupItem value="mrs" id="salutation-mrs" className="shrink-0" />
                          <Label htmlFor="salutation-mrs" className="cursor-pointer font-normal leading-none">
                            {t('fields.salutationMrs')}
                          </Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                  {errors.salutation && (
                    <p className="text-sm text-destructive">{errors.salutation.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="firstName">
                      {t('fields.firstName')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      autoComplete="given-name"
                      {...register('firstName')}
                      placeholder={t('fields.firstNamePlaceholder')}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="lastName">
                      {t('fields.lastName')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      autoComplete="family-name"
                      {...register('lastName')}
                      placeholder={t('fields.lastNamePlaceholder')}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">
                    {t('fields.email')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    {...register('email')}
                    placeholder={t('fields.emailPlaceholder')}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display">{t('steps.orderDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>
                    {t('fields.eventDateTime')} <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="eventDate"
                    control={control}
                    render={({ field: dateField }) => (
                      <Controller
                        name="eventTime"
                        control={control}
                        render={({ field: timeField }) => (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                className={cn(
                                  'w-full justify-start text-left font-normal',
                                  (!dateField.value || !timeField.value) && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                {dateField.value && timeField.value
                                  ? `${format(dateField.value, 'dd.MM.yyyy')} · ${timeField.value}`
                                  : t('fields.selectDate')}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] p-0" align="start">
                              <DateTimePicker
                                date={dateField.value}
                                time={timeField.value ?? ''}
                                onDateChange={dateField.onChange}
                                onTimeChange={timeField.onChange}
                                locale={locale === 'uk' ? 'uk-UA' : 'de-DE'}
                                placeholder={t('fields.selectDate')}
                                className="border-0 shadow-none rounded-none bg-popover"
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      />
                    )}
                  />
                  {(errors.eventDate || errors.eventTime) && (
                    <p className="text-sm text-destructive">
                      {errors.eventDate?.message ?? errors.eventTime?.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label>
                    {t('fields.celebrationDateTime')} <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="celebrationDate"
                    control={control}
                    render={({ field: dateField }) => (
                      <Controller
                        name="timeNeeded"
                        control={control}
                        render={({ field: timeField }) => (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                className={cn(
                                  'w-full justify-start text-left font-normal',
                                  (!dateField.value || !timeField.value) && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                {dateField.value && timeField.value
                                  ? `${format(dateField.value, 'dd.MM.yyyy')} · ${timeField.value}`
                                  : t('fields.selectDate')}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] p-0" align="start">
                              <DateTimePicker
                                date={dateField.value}
                                time={timeField.value ?? ''}
                                onDateChange={dateField.onChange}
                                onTimeChange={timeField.onChange}
                                locale={locale === 'uk' ? 'uk-UA' : 'de-DE'}
                                placeholder={t('fields.selectDate')}
                                className="border-0 shadow-none rounded-none bg-popover"
                              />
                            </PopoverContent>
                          </Popover>
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

                <div className="flex flex-col gap-2">
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

            <Card>
              <CardHeader>
                <CardTitle className="font-display">{t('steps.deliveryInfo')}</CardTitle>
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
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="pickup" id="pickup" />
                      <Label htmlFor="pickup" className="cursor-pointer font-normal">
                        {t('fields.pickup')}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="delivery" id="delivery" />
                      <Label htmlFor="delivery" className="cursor-pointer font-normal">
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
                    autoComplete="address-level2"
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
                        autoComplete="street-address"
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
                          autoComplete="postal-code"
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
                          autoComplete="address-level2"
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

            <Card>
              <CardHeader>
                <CardTitle className="font-display">{t('steps.additionalInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="checkout-main-national">
                    {t('fields.phone')} <span className="text-destructive">*</span>
                  </Label>
                  <PhoneInput
                    control={control}
                    dialName="phoneDialCode"
                    nationalName="phoneLocal"
                    options={phoneDialOptions}
                    nationalPlaceholder={t('fields.phoneNationalPlaceholder')}
                    idPrefix="checkout-main"
                    dialSelectAriaLabel={t('fields.phoneDialAria')}
                    nationalInvalid={Boolean(errors.phoneLocal)}
                  />
                  {(errors.phoneDialCode || errors.phoneLocal) && (
                    <p className="text-sm text-destructive">
                      {errors.phoneLocal?.message ?? errors.phoneDialCode?.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex flex-col gap-3 rounded-lg border border-border/80 bg-muted/20 p-4 flex-1 min-w-[min(100%,16rem)]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{t('contactConsent.infoTitle')}</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0 text-muted-foreground"
                            aria-label={t('contactConsent.infoTitle')}
                          >
                            <Info className="size-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="max-w-sm text-sm" align="start">
                          <p className="text-muted-foreground leading-relaxed">
                            {t('contactConsent.infoBody')}
                          </p>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-2">
                        <Controller
                          name="consentWhatsapp"
                          control={control}
                          render={({ field }) => (
                            <Checkbox
                              id="consent-wa"
                              checked={field.value}
                              onCheckedChange={(v) => field.onChange(v === true)}
                              className="mt-0.5"
                            />
                          )}
                        />
                        <Label htmlFor="consent-wa" className="cursor-pointer font-normal leading-snug">
                          {t('contactConsent.whatsapp')}
                        </Label>
                      </div>
                      <div className="flex items-start gap-2">
                        <Controller
                          name="consentTelegram"
                          control={control}
                          render={({ field }) => (
                            <Checkbox
                              id="consent-tg"
                              checked={field.value}
                              onCheckedChange={(v) => field.onChange(v === true)}
                              className="mt-0.5"
                            />
                          )}
                        />
                        <Label htmlFor="consent-tg" className="cursor-pointer font-normal leading-snug">
                          {t('contactConsent.telegram')}
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                {showMessengerAlternateField ? (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="checkout-messenger-national">
                      {t('contactConsent.messengerAlternateLabel')}
                    </Label>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t('contactConsent.messengerAlternateHint')}
                    </p>
                    <PhoneInput
                      control={control}
                      dialName="messengerPhoneDialCode"
                      nationalName="messengerPhoneLocal"
                      options={phoneDialOptions}
                      nationalPlaceholder={t('fields.messengerNationalPlaceholder')}
                      idPrefix="checkout-messenger"
                      dialSelectAriaLabel={t('fields.phoneDialAria')}
                      nationalInvalid={Boolean(errors.messengerPhoneLocal)}
                    />
                    {(errors.messengerPhoneDialCode || errors.messengerPhoneLocal) && (
                      <p className="text-sm text-destructive">
                        {errors.messengerPhoneLocal?.message ??
                          errors.messengerPhoneDialCode?.message}
                      </p>
                    )}
                  </div>
                ) : null}

                <div className="flex flex-col gap-2">
                  <Label htmlFor="referralSource">{t('fields.referralSource')}</Label>
                  <Select
                    value={watchedValues.referralSource ?? undefined}
                    onValueChange={(value) => setValue('referralSource', value)}
                  >
                    <SelectTrigger id="referralSource">
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
            </div>
          )}

          {/* Step 2: Übersicht — Review & Submit, order-summary-04 layout */}
          {currentStep === 2 && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="font-display text-2xl">{t('steps.review')}</CardTitle>
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
                        {t('fields.displayName')}
                      </Label>
                    </div>
                    <p className="pl-8 text-foreground font-medium">
                      {watchedValues.firstName || watchedValues.lastName
                        ? `${watchedValues.salutation === 'mrs' ? t('fields.salutationMrs') : t('fields.salutationMr')} ${watchedValues.firstName ?? ''} ${watchedValues.lastName ?? ''}`.trim()
                        : '—'}
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
                        {t('fields.phone')}
                      </Label>
                    </div>
                    <p className="pl-8 text-foreground font-medium">
                      {formatInternationalPhone(
                        watchedValues.phoneDialCode ?? '',
                        watchedValues.phoneLocal ?? ''
                      ) || '—'}
                    </p>
                  </div>

                  {(watchedValues.consentWhatsapp ||
                    watchedValues.consentTelegram ||
                    watchedValues.messengerPhoneLocal?.trim()) && (
                    <div className="flex flex-col gap-1 pl-8 text-sm text-muted-foreground">
                      {watchedValues.consentWhatsapp ? (
                        <span>{t('contactConsent.whatsapp')}</span>
                      ) : null}
                      {watchedValues.consentTelegram ? (
                        <span>{t('contactConsent.telegram')}</span>
                      ) : null}
                      {watchedValues.messengerPhoneLocal?.trim() ? (
                        <span>
                          {t('contactConsent.messengerAlternateLabel')}:{' '}
                          {formatInternationalPhone(
                            watchedValues.messengerPhoneDialCode?.trim() ||
                              watchedValues.phoneDialCode ||
                              '',
                            watchedValues.messengerPhoneLocal
                          )}
                        </span>
                      ) : null}
                    </div>
                  )}
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
                      {watchedValues.eventDate && watchedValues.eventTime
                        ? `${format(watchedValues.eventDate, 'dd.MM.yyyy')} · ${watchedValues.eventTime}`
                        : '—'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5">
                      <ClockIcon className="size-5 shrink-0 text-muted-foreground" />
                      <Label className="text-sm font-medium text-muted-foreground">
                        {t('fields.celebrationDateTime')}
                      </Label>
                    </div>
                    <p className="pl-8 text-foreground font-medium">
                      {watchedValues.celebrationDate && watchedValues.timeNeeded
                        ? `${format(watchedValues.celebrationDate, 'dd.MM.yyyy')} · ${watchedValues.timeNeeded}`
                        : '—'}
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

            {currentStep < TOTAL_INTERACTIVE_STEPS ? (
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
            <CardTitle className="font-display">{tCart('orderSummary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.lineKey}
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
                      {(item.deliveryDate || item.personCount != null) && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.deliveryDate && format(new Date(`${item.deliveryDate}T12:00:00`), 'dd.MM.yyyy')}
                          {item.deliveryDate && item.personCount != null && ' · '}
                          {item.personCount != null && `${item.personCount} ${t('fields.personCountShort')}`}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">x{item.quantity}</p>
                    </div>
                  </div>
                </div>
              ))}

              {(watchedValues.celebrationDate || watchedValues.pickupOrDelivery) && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-2.5">
                    {watchedValues.celebrationDate && watchedValues.timeNeeded && (
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <CalendarDaysIcon className="size-4 shrink-0" />
                          {t('summary.deliveryDate')}
                        </span>
                        <span className="font-medium text-right">
                          {format(watchedValues.celebrationDate, 'dd.MM.yyyy')} · {watchedValues.timeNeeded}
                        </span>
                      </div>
                    )}
                    {watchedValues.pickupOrDelivery && (
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <TruckIcon className="size-4 shrink-0" />
                          {t('summary.pickupOrDelivery')}
                        </span>
                        <span className="font-medium text-right">
                          {watchedValues.pickupOrDelivery === 'pickup'
                            ? t('fields.pickup')
                            : t('fields.delivery')}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

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
