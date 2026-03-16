'use client'

import * as React from 'react'
import { useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface AnimatedTabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsList> {
  value: string
}

const AnimatedTabsList = React.forwardRef<
  React.ElementRef<typeof TabsList>,
  AnimatedTabsListProps
>(({ className, value, children, ...props }, ref) => {
  const listRef = useRef<HTMLDivElement>(null)
  const triggerRefsMap = useRef<Map<string, HTMLButtonElement | null>>(new Map())
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 })

  useLayoutEffect(() => {
    const el = triggerRefsMap.current.get(value)
    if (el) {
      const list = listRef.current
      if (list) {
        const listRect = list.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        setUnderlineStyle({
          left: elRect.left - listRect.left,
          width: elRect.width,
        })
      }
    }
  }, [value])

  const childrenWithRefs = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === TabsTrigger && child.props.value != null) {
      const triggerValue = String(child.props.value)
      return React.cloneElement(child as React.ReactElement<{ ref?: React.Ref<HTMLButtonElement> }>, {
        ref: (el: HTMLButtonElement | null) => {
          triggerRefsMap.current.set(triggerValue, el)
        },
        className: cn(
          (child.props as { className?: string }).className,
          'bg-transparent dark:data-[state=active]:bg-transparent relative z-10 rounded-none border-0 data-[state=active]:shadow-none'
        ),
      })
    }
    return child
  })

  return (
    <div className="relative w-full" ref={listRef}>
      <TabsList
        ref={ref}
        className={cn('relative w-full justify-start rounded-none bg-transparent border-b-2 p-0 h-auto', className)}
        {...props}
      >
        {childrenWithRefs}
      </TabsList>
      <motion.div
        className="absolute bottom-0 left-0 z-0 h-0.5 bg-primary"
        initial={false}
        animate={{
          left: underlineStyle.left,
          width: underlineStyle.width,
        }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
      />
    </div>
  )
})
AnimatedTabsList.displayName = 'AnimatedTabsList'

export { Tabs, TabsContent, TabsList, TabsTrigger, AnimatedTabsList }
