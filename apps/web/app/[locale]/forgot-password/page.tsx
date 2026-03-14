import { ForgotPasswordForm } from '@/components/forgot-password-form'

export default function ForgotPasswordPage() {
  return (
    <div className="container py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="w-full">
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
