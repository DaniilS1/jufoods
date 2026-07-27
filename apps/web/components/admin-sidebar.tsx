'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ShoppingBag, Image, UtensilsCrossed, Package, Users, Settings, LogOut, LayoutGrid } from 'lucide-react'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type AdminTab = 'orders' | 'designs' | 'flavours' | 'products' | 'customers' | 'categories'

const sidebarItems: { id: AdminTab; icon: React.ElementType; key: AdminTab }[] = [
  { id: 'orders', icon: ShoppingBag, key: 'orders' },
  { id: 'designs', icon: Image, key: 'designs' },
  { id: 'flavours', icon: UtensilsCrossed, key: 'flavours' },
  { id: 'products', icon: Package, key: 'products' },
  { id: 'customers', icon: Users, key: 'customers' },
  { id: 'categories', icon: LayoutGrid, key: 'categories' },
]

interface AdminSidebarProps {
  locale: string
}

export function AdminSidebar({ locale }: AdminSidebarProps) {
  const t = useTranslations('admin.sidebar')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = (searchParams?.get('tab') as AdminTab) || 'orders'

  const handleTabChange = (tab: AdminTab) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('tab', tab)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = `/${locale}`
  }

  return (
    <aside className="hidden lg:flex flex-col w-[228px] shrink-0 bg-secondary text-secondary-foreground sticky top-0 h-screen overflow-y-auto">
      {/* Logo area */}
      <div className="px-5 py-5 border-b border-secondary-foreground/10">
        <div className="flex items-center gap-2">
          <Logo href={`/${locale}`} size="sm" />
          <span className="text-xs font-semibold text-secondary-foreground/60 uppercase tracking-wider">Admin</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-0.5 p-3 flex-1">
        {sidebarItems.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
              activeTab === id
                ? 'bg-secondary-foreground/15 text-secondary-foreground'
                : 'text-secondary-foreground/70 hover:bg-secondary-foreground/10 hover:text-secondary-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {t(id)}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-secondary-foreground/10 flex flex-col gap-0.5">
        <Link
          href={`/${locale}/account`}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-secondary-foreground/70 hover:bg-secondary-foreground/10 hover:text-secondary-foreground transition-colors"
        >
          <Settings className="h-4 w-4 shrink-0" />
          {t('settings')}
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-secondary-foreground/70 hover:bg-secondary-foreground/10 hover:text-secondary-foreground transition-colors text-left"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {t('logout')}
        </button>
      </div>
    </aside>
  )
}

export function AdminMobileHeader({ locale }: { locale: string }) {
  const t = useTranslations('admin.sidebar')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = (searchParams?.get('tab') as AdminTab) || 'orders'

  const mobileTabs: AdminTab[] = ['orders', 'designs', 'flavours', 'products', 'customers', 'categories']

  const handleTabChange = (tab: AdminTab) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('tab', tab)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="lg:hidden bg-secondary text-secondary-foreground">
      <div className="flex items-center gap-3 px-4 py-3">
        <Logo href={`/${locale}`} size="sm" />
        <span className="text-sm font-semibold text-secondary-foreground/80">Admin</span>
        <span className="ml-auto text-xs bg-primary/30 text-secondary-foreground px-2 py-0.5 rounded-full font-semibold">
          Admin
        </span>
      </div>
      {/* Tab pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-3 -mx-0">
        {mobileTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={cn(
              'shrink-0 flex items-center justify-center min-h-[44px] px-3.5 rounded-full text-xs font-medium transition-colors border',
              activeTab === tab
                ? 'bg-secondary-foreground/20 text-secondary-foreground border-secondary-foreground/30'
                : 'text-secondary-foreground/60 border-secondary-foreground/15 hover:bg-secondary-foreground/10 hover:text-secondary-foreground'
            )}
          >
            {t(tab)}
          </button>
        ))}
      </div>
    </div>
  )
}
