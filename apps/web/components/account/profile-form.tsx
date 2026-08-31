'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import type { AccountProfileResponse } from '@/components/account/account-client'
import type { Locale } from '@/i18n'

function createProfileSchema(t: (key: string) => string) {
  return z.object({
    fullName: z
      .string()
      .trim()
      .min(2, t('nameMinLength'))
      .max(120, t('nameMaxLength')),
    phone: z
      .string()
      .trim()
      .max(32, t('phoneMaxLength'))
      .optional()
      .or(z.literal('')),
    preferredLanguage: z.enum(['de', 'uk']),
    marketingOptIn: z.boolean(),
    notificationsEmail: z.boolean(),
  })
}

type ProfileFormValues = z.infer<ReturnType<typeof createProfileSchema>>

interface ProfileFormProps {
  data: AccountProfileResponse
  email: string
  locale: Locale
}

export function ProfileForm({ data, email, locale }: ProfileFormProps) {
  const t = useTranslations('account')
  const tAuth = useTranslations('auth')
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const profileSchema = createProfileSchema(t)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: resolveDefaultValues(data, locale),
  })

  useEffect(() => {
    form.reset(resolveDefaultValues(data, locale))
    setStatus('idle')
  }, [data, locale, form])

  const mutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const payload = {
        fullName: values.fullName,
        phone: values.phone?.trim() ? values.phone.trim() : null,
        preferredLanguage: values.preferredLanguage,
        marketingOptIn: values.marketingOptIn,
        notificationsEmail: values.notificationsEmail,
      }
      const response = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to save profile')
      }

      return response.json()
    },
    onSuccess: async () => {
      setStatus('success')
      await queryClient.invalidateQueries({ queryKey: ['account-profile'] })
    },
    onError: () => {
      setStatus('error')
    },
  })

  const onSubmit = (values: ProfileFormValues) => {
    setStatus('idle')
    mutation.mutate(values)
  }

  return (
    <Card className="border border-primary/10 shadow-sm">
      <CardHeader>
        <CardTitle className="font-display">{t('profileHeading')}</CardTitle>
        <CardDescription>{t('profileDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{tAuth('email')}</Label>
            <Input id="email" value={email} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">{t('nameLabel')}</Label>
            <Input id="fullName" {...form.register('fullName')} />
            {form.formState.errors.fullName && (
              <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('phoneLabel')}</Label>
            <Input id="phone" {...form.register('phone')} />
            {form.formState.errors.phone && (
              <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('languageLabel')}</Label>
            <Select
              value={form.watch('preferredLanguage')}
              onValueChange={(value) => form.setValue('preferredLanguage', value as ProfileFormValues['preferredLanguage'])}
            >
              <SelectTrigger>
                <SelectValue placeholder={locale.toUpperCase()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="uk">Українська</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 rounded-lg border border-border/60 p-4">
            <CheckboxField
              label={t('marketingLabel')}
              checked={form.watch('marketingOptIn')}
              onCheckedChange={(checked) => form.setValue('marketingOptIn', Boolean(checked))}
            />
            <CheckboxField
              label={t('notificationsLabel')}
              checked={form.watch('notificationsEmail')}
              onCheckedChange={(checked) => form.setValue('notificationsEmail', Boolean(checked))}
            />
          </div>

          {status === 'success' && (
            <StatusMessage type="success" message={t('profileSuccess')} />
          )}
          {status === 'error' && (
            <StatusMessage type="error" message={t('profileError')} />
          )}

          <Button type="submit" className="w-full sm:w-auto" disabled={mutation.isPending}>
            {mutation.isPending ? t('saveProfile') : t('saveProfile')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function resolveDefaultValues(data: AccountProfileResponse, locale: Locale): ProfileFormValues {
  return {
    fullName: data.profile.fullName ?? '',
    phone: data.profile.phone ?? '',
    preferredLanguage: (data.settings.preferredLanguage ?? locale) as ProfileFormValues['preferredLanguage'],
    marketingOptIn: data.settings.marketingOptIn ?? false,
    notificationsEmail: data.settings.notificationsEmail ?? true,
  }
}

interface CheckboxFieldProps {
  label: string
  checked: boolean
  onCheckedChange: (value: boolean) => void
}

function CheckboxField({ label, checked, onCheckedChange }: CheckboxFieldProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(Boolean(value))} />
      <span className="text-sm text-muted-foreground">{label}</span>
    </label>
  )
}

interface StatusMessageProps {
  type: 'success' | 'error'
  message: string
}

function StatusMessage({ type, message }: StatusMessageProps) {
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle
  const bgClass = type === 'success' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-destructive/10 text-destructive'

  return (
    <div className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${bgClass}`}>
      <Icon className="h-4 w-4" />
      <span>{message}</span>
    </div>
  )
}

