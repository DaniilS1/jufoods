'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Package, Palette, Users, ShoppingBag, ChefHat } from 'lucide-react'

const adminTabs = [
  { id: 'products', icon: Package, translationKey: 'products' },
  { id: 'designs', icon: Palette, translationKey: 'designs' },
  { id: 'flavours', icon: ChefHat, translationKey: 'flavours' },
  { id: 'customers', icon: Users, translationKey: 'customers' },
  { id: 'orders', icon: ShoppingBag, translationKey: 'orders' },
] as const

export function AdminTabs() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('admin.tabs')
  
  const activeTab = searchParams?.get('tab') || 'products'

  function handleTabChange(tabId: string) {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('tab', tabId)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="border-t border-primary/10 bg-transparent">
      <div className="container">
        <nav className="flex gap-2 overflow-x-auto scrollbar-hide py-2 -mx-4 px-4">
          {adminTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 relative',
                  isActive
                    ? 'text-muted-foreground bg-primary/10'
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{t(tab.translationKey)}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

