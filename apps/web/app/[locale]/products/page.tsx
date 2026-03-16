import { redirect } from 'next/navigation'
import type { Locale } from '@/i18n'

interface ProductsPageProps {
  params: { locale: Locale }
}

export default function ProductsIndexPage({ params }: ProductsPageProps) {
  redirect(`/${params.locale}`)
}
