'use client'

import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'

export function ThemeToggle() {
  const { toggleTheme, theme, isMounted } = useTheme()

  const themeLabels: Record<'jufoods' | 'neutral', string> = {
    jufoods: 'Original',
    neutral: 'Atelier',
  }

  const nextTheme = theme === 'jufoods' ? 'neutral' : 'jufoods'

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative h-9 w-24 rounded-full bg-accent/40 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={`Farbwelt wechseln – aktives Thema ${themeLabels[theme]}`}
      aria-live="polite"
    >
      {isMounted ? (
        <span className="flex w-full items-center justify-center gap-1">
          <span className="font-semibold">{themeLabels[theme]}</span>
          <span className="text-xs text-muted-foreground">→ {themeLabels[nextTheme]}</span>
        </span>
      ) : (
        <span className="inline-flex h-5 w-full animate-pulse items-center justify-center rounded-full bg-primary/30 text-xs text-primary-foreground">
          Laden…
        </span>
      )}
    </Button>
  )
}

