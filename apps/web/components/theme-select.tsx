'use client'

import { useMemo } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTheme } from '@/components/theme-provider'

interface ThemeOption {
  value: 'jufoods' | 'neutral'
  label: string
  description: string
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: 'neutral',
    label: 'Atelier',
    description: 'Gedämpfte Nude- und Taupe-Nuancen',
  },
  {
    value: 'jufoods',
    label: 'Classic',
    description: 'Karamell- und Vanillenoten',
  },
]

export function ThemeSelect() {
  const { theme, setTheme, isMounted } = useTheme()

  const options = useMemo(() => THEME_OPTIONS, [])

  return (
    <Select
      value={isMounted ? theme : undefined}
      onValueChange={(value) => setTheme(value as 'jufoods' | 'neutral')}
      disabled={!isMounted}
    >
      <SelectTrigger
        className="w-[12rem] rounded-full border-border bg-background/80 text-sm font-medium text-foreground focus:ring-ring"
        aria-label="Farbwelt auswählen"
      >
        <SelectValue placeholder="Farbwelt wählen" />
      </SelectTrigger>
      <SelectContent className="min-w-[12rem] rounded-xl border-border/60 bg-popover/95 backdrop-blur-md">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="rounded-lg">
            <div className="flex flex-col">
              <span className="font-semibold">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

