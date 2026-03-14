'use client'

import { format } from 'date-fns'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

const today = new Date()
today.setHours(0, 0, 0, 0)

const TIME_SLOTS = Array.from({ length: 57 }, (_, i) => {
  const totalMinutes = i * 15
  const hour = Math.floor(totalMinutes / 60) + 7
  const minute = totalMinutes % 60
  if (hour > 21) return null
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}).filter(Boolean) as string[]

interface DateTimePickerProps {
  date: Date | undefined
  time: string
  onDateChange: (date: Date | undefined) => void
  onTimeChange: (time: string) => void
  locale?: string
  placeholder?: string
  className?: string
}

export function DateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  locale = 'de-DE',
  placeholder = 'Datum und Uhrzeit wählen',
  className,
}: DateTimePickerProps) {
  return (
    <div className={cn('rounded-lg border bg-card overflow-hidden', className)}>
      <div className='relative md:pr-44'>
        {/* Calendar */}
        <div className='p-4'>
          <Calendar
            mode='single'
            selected={date}
            onSelect={onDateChange}
            defaultMonth={date ?? new Date()}
            disabled={(d) => d < today}
            showOutsideDays={false}
            className='bg-transparent p-0'
          />
        </div>

        {/* Time slots */}
        <div className='inset-y-0 right-0 flex w-full flex-col border-t max-md:h-52 md:absolute md:w-44 md:border-t-0 md:border-l'>
          <ScrollArea className='h-full'>
            <div className='flex flex-col gap-1.5 p-4'>
              {TIME_SLOTS.map((slot) => (
                <Button
                  key={slot}
                  type='button'
                  variant={time === slot ? 'default' : 'outline'}
                  onClick={() => onTimeChange(slot)}
                  className='w-full shadow-none'
                  size='sm'
                >
                  {slot}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Footer */}
      <div className='flex items-center gap-2 border-t px-4 py-3 text-sm'>
        {date && time ? (
          <>
            <CheckCircle2 className='size-4 shrink-0 text-primary' />
            <span>
              {date.toLocaleDateString(locale, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}{' '}
              &mdash; <strong>{time} Uhr</strong>
            </span>
          </>
        ) : (
          <span className='text-muted-foreground'>{placeholder}</span>
        )}
      </div>
    </div>
  )
}
