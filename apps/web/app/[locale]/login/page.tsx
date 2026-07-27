import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { LoginForm } from '@/components/login-form'

export default async function LoginPage() {
  const t = await getTranslations('auth')

  return (
    <div className="container py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="w-full">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}

