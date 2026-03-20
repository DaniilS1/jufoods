'use client'

import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { Cake, Palette } from 'lucide-react'
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
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap touch-manipulation transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 sm:gap-2',
          currentView === 'designs'
            ? 'bg-white text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground active:text-foreground'
        )}
      >
        <Palette className="size-3.5 shrink-0 sm:size-4" aria-hidden="true" />
        {t('viewDesigns')}
      </button>
      <button
        onClick={() => switchTo('flavours')}
        aria-pressed={currentView === 'flavours'}
        aria-label={t('viewFlavours')}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap touch-manipulation transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 sm:gap-2',
          currentView === 'flavours'
            ? 'bg-white text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground active:text-foreground'
        )}
      >
        <Cake className="size-3.5 shrink-0 sm:size-4" aria-hidden="true" />
        {t('viewFlavours')}
      </button>
    </div>
  )
}
