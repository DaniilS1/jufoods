import { getTranslations } from 'next-intl/server'
import { RegisterForm } from '@/components/register-form'

export default async function RegisterPage() {
  const t = await getTranslations('auth')

  return (
    <div className="container py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="w-full">
        <RegisterForm />
      </div>
    </div>
  )
}

