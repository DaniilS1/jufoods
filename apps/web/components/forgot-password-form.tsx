'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'
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
  email: z.string().email(t('invalidEmail') || 'Invalid email address'),
})

type FormData = z.infer<ReturnType<typeof createSchema>>

export function ForgotPasswordForm() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const pathname = usePathname()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

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
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/${localePrefix}/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
        return
      }

      setSent(true)
    } catch (err) {
      setError(tCommon('error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">{t('forgotPasswordTitle')}</CardTitle>
        <CardDescription className="text-center">
          {t('forgotPasswordDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/10 text-green-700">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm">{t('forgotPasswordSent')}</p>
            </div>
            <Link
              href={`/${localePrefix}/login`}
              className="block text-center text-sm text-primary hover:underline font-medium"
            >
              {t('backToLogin')}
            </Link>
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
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={t('email')}
                spellCheck={false}
                {...register('email')}
                className={cn(errors.email && 'border-destructive')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? tCommon('loading') : t('forgotPasswordSend')}
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
