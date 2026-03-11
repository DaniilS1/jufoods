import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Locale } from '@/i18n'

interface AdminLayoutProps {
  children: React.ReactNode
  params: { locale: Locale }
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${params.locale}/login`)
  }

  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userRow?.role !== 'admin') {
    redirect(`/${params.locale}`)
  }

  return <>{children}</>
}
