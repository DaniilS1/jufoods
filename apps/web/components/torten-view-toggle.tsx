'use client'

import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

interface TortenViewToggleProps {
  currentView: 'designs' | 'flavours'
}

export function TortenViewToggle({ currentView }: TortenViewToggleProps) {
  const t = useTranslations('catalog')
  const router = useRouter()
  const searchParams = useSearchParams()

  function switchTo(view: 'designs' | 'flavours') {
    if (view === currentView) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('category', 'torten')
    if (view === 'designs') {
      params.delete('view')
    } else {
      params.set('view', view)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div
      role="group"
      aria-label={t('viewDesigns') + ' / ' + t('viewFlavours')}
      className="inline-flex items-center rounded-lg bg-primary/10 p-1 gap-0.5 shrink-0"
    >
      <button
        onClick={() => switchTo('designs')}
        aria-pressed={currentView === 'designs'}
        aria-label={t('viewDesigns')}
        className={cn(
          'px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
          currentView === 'designs'
            ? 'bg-white text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground active:text-foreground'
        )}
      >
        {t('viewDesigns')}
      </button>
      <button
        onClick={() => switchTo('flavours')}
        aria-pressed={currentView === 'flavours'}
        aria-label={t('viewFlavours')}
        className={cn(
          'px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
          currentView === 'flavours'
            ? 'bg-white text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground active:text-foreground'
        )}
      >
        {t('viewFlavours')}
      </button>
    </div>
  )
}
