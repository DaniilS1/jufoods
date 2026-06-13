'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const createSchema = (t: any) => z.object({
  password: z.string().min(6, t('passwordMinLength') || 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, t('passwordMinLength') || 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: t('passwordsDoNotMatch') || 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormData = z.infer<ReturnType<typeof createSchema>>

export function ResetPasswordForm() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const localePrefix = pathname?.split('/')[1] || locale
  const schema = createSchema(t)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/${localePrefix}`)
        router.refresh()
      }, 2000)
    } catch (err) {
      setError(tCommon('error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="space-y-1">
        <CardTitle className="font-display text-2xl font-bold text-center">{t('resetPasswordTitle')}</CardTitle>
        <CardDescription className="text-center">
          {t('resetPasswordDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/10 text-green-700">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm">{t('resetPasswordSuccess')}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">{t('newPassword')}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder={t('newPassword')}
                {...register('password')}
                className={cn(errors.password && 'border-destructive')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmNewPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder={t('confirmNewPassword')}
                {...register('confirmPassword')}
                className={cn(errors.confirmPassword && 'border-destructive')}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? tCommon('loading') : t('resetPasswordSubmit')}
            </Button>

            <div className="text-center">
              <Link
                href={`/${localePrefix}/login`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {t('backToLogin')}
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
