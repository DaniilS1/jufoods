'use client'

import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import dynamic from 'next/dynamic'
import { AdminSidebar, AdminMobileHeader } from '@/components/admin-sidebar'
import { Skeleton } from '@/components/ui/skeleton'

function AdminSectionSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-xl" />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// Dynamically import admin components to reduce initial bundle size
const AdminProductManagement = dynamic(
  () => import('@/components/admin-product-management').then((mod) => ({ default: mod.AdminProductManagement })),
  { ssr: false, loading: () => <AdminSectionSkeleton /> }
)

const AdminDesignManagement = dynamic(
  () => import('@/components/admin-design-management').then((mod) => ({ default: mod.AdminDesignManagement })),
  { ssr: false, loading: () => <AdminSectionSkeleton /> }
)

const AdminFlavourManagement = dynamic(
  () => import('@/components/admin-flavour-management').then((mod) => ({ default: mod.AdminFlavourManagement })),
  { ssr: false, loading: () => <AdminSectionSkeleton /> }
)

const AdminCustomersManagement = dynamic(
  () =>
    import('@/components/admin-customers-management').then((mod) => ({
      default: mod.AdminCustomersManagement,
    })),
  { ssr: false, loading: () => <AdminSectionSkeleton /> }
)

const AdminOrdersManagement = dynamic(
  () =>
    import('@/components/admin-orders-management').then((mod) => ({
      default: mod.AdminOrdersManagement,
    })),
  { ssr: false, loading: () => <AdminSectionSkeleton /> }
)

const AdminCategoryImages = dynamic(
  () =>
    import('@/components/admin-category-images').then((mod) => ({
      default: mod.AdminCategoryImages,
    })),
  { ssr: false, loading: () => <AdminSectionSkeleton /> }
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
