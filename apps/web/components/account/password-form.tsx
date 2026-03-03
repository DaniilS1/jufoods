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

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, 'Min. 8 characters'),
    confirmPassword: z.string().min(8, 'Min. 8 characters'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type PasswordFormValues = z.infer<typeof passwordSchema>

export function PasswordForm() {
  const t = useTranslations('account')
  const tAuth = useTranslations('auth')
  const tCommon = useTranslations('common')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: PasswordFormValues) => {
    setStatus('idle')
    try {
      const response = await fetch('/api/account/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword: values.newPassword }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Unable to update password')
      }

      form.reset()
      setStatus('success')
    } catch (error) {
      console.error(error)
      setStatus('error')
    }
  }

  return (
    <Card className="border border-primary/10 shadow-sm">
      <CardHeader>
        <CardTitle>{t('passwordHeading')}</CardTitle>
        <CardDescription>{t('passwordDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('newPassword')}</Label>
            <Input id="newPassword" type="password" {...form.register('newPassword')} />
            {form.formState.errors.newPassword && (
              <p className="text-sm text-destructive">{form.formState.errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirmPassword') || tAuth('confirmPassword')}</Label>
            <Input id="confirmPassword" type="password" {...form.register('confirmPassword')} />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          {status === 'success' && <StatusBanner type="success" message={t('passwordSuccess')} />}
          {status === 'error' && <StatusBanner type="error" message={t('passwordError')} />}

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



