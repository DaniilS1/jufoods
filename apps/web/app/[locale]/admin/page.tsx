'use client'

import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'

// Dynamically import admin components to reduce initial bundle size
const AdminProductManagement = dynamic(
  () => import('@/components/admin-product-management').then((mod) => ({ default: mod.AdminProductManagement })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    ),
  }
)

const AdminDesignManagement = dynamic(
  () => import('@/components/admin-design-management').then((mod) => ({ default: mod.AdminDesignManagement })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    ),
  }
)

const AdminFlavourManagement = dynamic(
  () => import('@/components/admin-flavour-management').then((mod) => ({ default: mod.AdminFlavourManagement })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    ),
  }
)

export default function AdminPage() {
  const searchParams = useSearchParams()
  const activeTab = searchParams?.get('tab') || 'products'
  const t = useTranslations('admin')

  return (
    <div className="container py-8 min-h-0">
      <div className="mb-8 max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      <div className="mx-auto max-w-6xl space-y-6 min-h-0">
        {activeTab === 'products' && <AdminProductManagement />}
        {activeTab === 'designs' && <AdminDesignManagement />}
        {activeTab === 'flavours' && <AdminFlavourManagement />}
        {activeTab === 'customers' && (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t('customers.comingSoon')}</p>
          </div>
        )}
        {activeTab === 'orders' && (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t('orders.comingSoon')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

