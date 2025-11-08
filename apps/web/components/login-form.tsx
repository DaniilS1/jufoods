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
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const createLoginSchema = (t: any) => z.object({
  email: z.string().email(t('invalidEmail') || 'Invalid email address'),
  password: z.string().min(6, t('passwordMinLength') || 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>

export function LoginForm() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const localePrefix = pathname?.split('/')[1] || locale
  const loginSchema = createLoginSchema(t)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
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

      // Redirect to home page after successful login
      router.push(`/${localePrefix}`)
      router.refresh()
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
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('email')}
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
              placeholder={t('password')}
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
      </CardContent>
    </Card>
  )
}

