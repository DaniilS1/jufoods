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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const createRegisterSchema = (t: any) => z.object({
  firstName: z.string().min(1, t('firstName')),
  lastName: z.string().min(1, t('lastName')),
  email: z.string().email(t('invalidEmail') || 'Invalid email address'),
  password: z.string().min(6, t('passwordMinLength') || 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, t('passwordMinLength') || 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: t('passwordsDoNotMatch') || 'Passwords do not match',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>

export function RegisterForm() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)

  const localePrefix = pathname?.split('/')[1] || locale

  const registerSchema = createRegisterSchema(t)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/${localePrefix}`,
          data: { full_name: fullName },
        },
      })

      if (signUpError) {
        setError(signUpError.message || t('registerError') || 'Registration failed. Please try again.')
        setIsSubmitting(false)
        return
      }

      if (signUpData.user && !signUpData.session) {
        setSuccess(true)
        setShowVerifyDialog(true)
        setIsSubmitting(false)
      } else if (signUpData.session) {
        setSuccess(true)
        setTimeout(() => {
          router.push(`/${localePrefix}`)
          router.refresh()
        }, 1500)
        setIsSubmitting(false)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('registerError') || 'An unexpected error occurred'
      setError(errorMessage)
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">{t('register')}</CardTitle>
        <CardDescription className="text-center">
          {t('registerDescription') || 'Erstellen Sie ein neues Konto'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {t('registerSuccess') || 'Registration successful! Please check your email to confirm your account.'}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t('firstName')}</Label>
              <Input
                id="firstName"
                type="text"
                autoComplete="given-name"
                placeholder={t('firstNamePlaceholder') || 'Max'}
                {...register('firstName')}
                className={cn(errors.firstName && 'border-destructive')}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">{t('lastName')}</Label>
              <Input
                id="lastName"
                type="text"
                autoComplete="family-name"
                placeholder={t('lastNamePlaceholder') || 'Müller'}
                {...register('lastName')}
                className={cn(errors.lastName && 'border-destructive')}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t('emailPlaceholder') || 'beispiel@gmail.com'}
              spellCheck={false}
              {...register('email')}
              className={cn(errors.email && 'border-destructive')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder={t('passwordPlaceholder') || '••••••••'}
              {...register('password')}
              className={cn(errors.password && 'border-destructive')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder={t('confirmPasswordPlaceholder') || '••••••••'}
              {...register('confirmPassword')}
              className={cn(errors.confirmPassword && 'border-destructive')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || success}>
            {isSubmitting ? tCommon('loading') : t('register')}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <span>{t('hasAccount')} </span>
            <Link href={`/${localePrefix}/login`} className="text-primary hover:underline font-medium">
              {t('login')}
            </Link>
          </div>
        </form>
      </CardContent>
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('verifyEmailTitle') || 'Bitte bestätige deine E-Mail'}</DialogTitle>
            <DialogDescription>
              {t('verifyEmailDescription') ||
                'Wir haben dir einen Bestätigungslink gesendet. Öffne deine Mailbox und klicke auf den Link, um dein Konto zu aktivieren.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowVerifyDialog(false)}>
              {t('verifyEmailCta') || 'Alles klar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
