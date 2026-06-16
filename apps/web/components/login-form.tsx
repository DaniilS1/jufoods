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
import { AlertCircle, CheckCircle2, Zap, Lock, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const createLoginSchema = (t: any) => z.object({
  email: z.string().email(t('invalidEmail') || 'Invalid email address'),
  password: z.string().min(6, t('passwordMinLength') || 'Password must be at least 6 characters'),
})

const createMagicLinkSchema = (t: any) => z.object({
  email: z.string().email(t('invalidEmail') || 'Invalid email address'),
})

type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>
type MagicLinkFormData = z.infer<ReturnType<typeof createMagicLinkSchema>>

export function LoginForm() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [showMagicDialog, setShowMagicDialog] = useState(false)

  const localePrefix = pathname?.split('/')[1] || locale
  const loginSchema = createLoginSchema(t)
  const magicLinkSchema = createMagicLinkSchema(t)

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const {
    register: registerMagic,
    handleSubmit: handleSubmitMagic,
    formState: { errors: errorsMagic },
  } = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      router.push(`/${localePrefix}`)
      router.refresh()
    } catch (err) {
      setError(t('loginError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const onMagicLink = async (data: MagicLinkFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/${localePrefix}`,
        },
      })

      if (otpError) {
        setError(otpError.message)
        return
      }

      setShowMagicDialog(true)
    } catch (err) {
      setError(t('loginError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">{t('login')}</CardTitle>
        <CardDescription className="text-center">
          {t('loginDescription') || 'Melden Sie sich mit Ihrem Konto an'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => { setMode('password'); setError(null) }}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 py-2 text-sm font-medium transition-colors',
              mode === 'password'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            {t('password')}
          </button>
          <button
            type="button"
            onClick={() => { setMode('magic'); setError(null) }}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 py-2 text-sm font-medium transition-colors',
              mode === 'magic'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            {t('magicLink')}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {mode === 'password' ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('password')}</Label>
                <Link
                  href={`/${localePrefix}/forgot-password`}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('forgotPassword')}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder={t('passwordPlaceholder') || '••••••••'}
                {...register('password')}
                className={cn(errors.password && 'border-destructive')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? tCommon('loading') : t('login')}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <span>{t('noAccount')} </span>
              <Link href={`/${localePrefix}/register`} className="text-primary hover:underline font-medium">
                {t('register')}
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmitMagic(onMagicLink)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="magic-email">{t('email')}</Label>
              <Input
                id="magic-email"
                type="email"
                autoComplete="email"
                placeholder={t('emailPlaceholder') || 'beispiel@gmail.com'}
                spellCheck={false}
                {...registerMagic('email')}
                className={cn(errorsMagic.email && 'border-destructive')}
              />
              {errorsMagic.email && (
                <p className="text-sm text-destructive">{errorsMagic.email.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? tCommon('loading') : t('magicLinkSend')}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <span>{t('noAccount')} </span>
              <Link href={`/${localePrefix}/register`} className="text-primary hover:underline font-medium">
                {t('register')}
              </Link>
            </div>
          </form>
        )}
      </CardContent>

      <Dialog open={showMagicDialog} onOpenChange={setShowMagicDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('magicLink')}</DialogTitle>
            <DialogDescription>{t('magicLinkSent')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowMagicDialog(false)}>
              {t('verifyEmailCta') || 'Alles klar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
