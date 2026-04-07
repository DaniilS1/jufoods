'use client'

import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export type PhoneDialOption = { value: string; label: string }

type PhoneInputProps<T extends FieldValues> = {
  control: Control<T>
  dialName: FieldPath<T>
  nationalName: FieldPath<T>
  options: PhoneDialOption[]
  nationalPlaceholder: string
  idPrefix: string
  dialSelectAriaLabel: string
  nationalInvalid?: boolean
  className?: string
}

/**
 * Compound phone control: country calling code (Select) + national number (Input).
 * Matches shadcn heights (h-9), uses gap layout and focus-within ring (Web Interface Guidelines).
 */
export function PhoneInput<T extends FieldValues>({
  control,
  dialName,
  nationalName,
  options,
  nationalPlaceholder,
  idPrefix,
  dialSelectAriaLabel,
  nationalInvalid,
  className,
}: PhoneInputProps<T>) {
  const dial = useController({ control, name: dialName })
  const nat = useController({ control, name: nationalName })

  const dialId = `${idPrefix}-dial`
  const natId = `${idPrefix}-national`
  const dialValue = dial.field.value || options[0]?.value || '+49'

  return (
    <div
      className={cn(
        'flex min-w-0 rounded-md border border-input bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring',
        className
      )}
    >
      <Select
        value={dialValue}
        onValueChange={(v) => {
          dial.field.onChange(v)
        }}
      >
        <SelectTrigger
          id={dialId}
          aria-label={dialSelectAriaLabel}
          className="h-9 w-[min(11.5rem,46vw)] shrink-0 gap-1 rounded-none rounded-l-md border-0 border-r border-input bg-transparent px-2.5 shadow-none focus:z-10 focus:ring-0 focus:ring-offset-0 data-[placeholder]:text-muted-foreground sm:w-44"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-[min(20rem,70dvh)]">
          <SelectGroup>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Input
        id={natId}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        spellCheck={false}
        aria-invalid={nationalInvalid}
        className="h-9 min-w-0 flex-1 rounded-none rounded-r-md border-0 shadow-none focus-visible:z-10 focus-visible:ring-0 focus-visible:ring-offset-0"
        placeholder={nationalPlaceholder}
        value={nat.field.value ?? ''}
        onChange={nat.field.onChange}
        onBlur={nat.field.onBlur}
        name={nat.field.name}
        ref={nat.field.ref}
      />
    </div>
  )
}
