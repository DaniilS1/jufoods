'use client'

import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import dynamic from 'next/dynamic'
import { AdminSidebar, AdminMobileHeader } from '@/components/admin-sidebar'

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

const AdminCustomersManagement = dynamic(
  () =>
    import('@/components/admin-customers-management').then((mod) => ({
      default: mod.AdminCustomersManagement,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    ),
  }
)

const AdminOrdersManagement = dynamic(
  () =>
    import('@/components/admin-orders-management').then((mod) => ({
      default: mod.AdminOrdersManagement,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    ),
  }
)

const AdminCategoryImages = dynamic(
  () =>
    import('@/components/admin-category-images').then((mod) => ({
      default: mod.AdminCategoryImages,
    })),
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
  const activeTab = searchParams?.get('tab') || 'orders'
  const locale = useLocale()

  return (
    <div className="flex flex-1 min-h-0">
      {/* Desktop sidebar */}
      <AdminSidebar locale={locale} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile dark sub-header */}
        <AdminMobileHeader locale={locale} />

        {/* Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          {activeTab === 'products'   && <AdminProductManagement />}
          {activeTab === 'designs'    && <AdminDesignManagement />}
          {activeTab === 'flavours'   && <AdminFlavourManagement />}
          {activeTab === 'customers'  && <AdminCustomersManagement />}
          {activeTab === 'orders'     && <AdminOrdersManagement />}
          {activeTab === 'categories' && <AdminCategoryImages />}
        </div>
      </div>
    </div>
  )
}

