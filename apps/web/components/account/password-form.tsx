'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { mapAuthErrorMessage } from '@/lib/auth/error-messages'

function createPasswordSchema(t: (key: string) => string, tAccount: (key: string) => string) {
  return z
    .object({
      currentPassword: z.string().min(1, tAccount('currentPasswordRequired')),
      newPassword: z.string().min(8, t('passwordMinLength')),
      confirmPassword: z.string().min(8, t('passwordMinLength')),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('passwordsDoNotMatch'),
      path: ['confirmPassword'],
    })
}

type PasswordFormValues = z.infer<ReturnType<typeof createPasswordSchema>>

export function PasswordForm() {
  const t = useTranslations('account')
  const tAuth = useTranslations('auth')
  const tCommon = useTranslations('common')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const passwordSchema = createPasswordSchema(tAuth, t)

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: PasswordFormValues) => {
    setStatus('idle')
    setErrorMessage(null)
    try {
      const response = await fetch('/api/account/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        if (payload.error === 'invalid_current_password') {
          setErrorMessage(t('currentPasswordIncorrect'))
        } else {
          setErrorMessage(mapAuthErrorMessage(tAuth, payload.error))
        }
        setStatus('error')
        return
      }

      form.reset()
      setStatus('success')
    } catch (error) {
      console.error(error)
      setErrorMessage(t('passwordError'))
      setStatus('error')
    }
  }

  return (
    <Card className="border border-primary/10 shadow-sm">
      <CardHeader>
        <CardTitle className="font-display">{t('passwordHeading')}</CardTitle>
        <CardDescription>{t('passwordDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              placeholder={t('currentPasswordPlaceholder')}
              {...form.register('currentPassword')}
            />
            {form.formState.errors.currentPassword && (
              <p className="text-sm text-destructive">{form.formState.errors.currentPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('newPassword')}</Label>
            <Input id="newPassword" type="password" autoComplete="new-password" {...form.register('newPassword')} />
            {form.formState.errors.newPassword && (
              <p className="text-sm text-destructive">{form.formState.errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirmPassword') || tAuth('confirmPassword')}</Label>
            <Input id="confirmPassword" type="password" autoComplete="new-password" {...form.register('confirmPassword')} />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          {status === 'success' && <StatusBanner type="success" message={t('passwordSuccess')} />}
          {status === 'error' && <StatusBanner type="error" message={errorMessage || t('passwordError')} />}

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? tCommon('loading') : t('passwordSave')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function StatusBanner({ type, message }: { type: 'success' | 'error'; message: string }) {
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle
  const styles =
    type === 'success'
      ? 'bg-green-500/10 text-green-600 dark:text-green-400'
      : 'bg-destructive/10 text-destructive'

  return (
    <div className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${styles}`}>
      <Icon className="h-4 w-4" />
      <span>{message}</span>
    </div>
  )
}
