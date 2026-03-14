import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const SIZES = {
  sm: 36,
  md: 44,
  lg: 56,
} as const

interface LogoProps {
  href?: string
  size?: keyof typeof SIZES
  /** Set true for above-the-fold logos (header) to avoid LCP penalty */
  priority?: boolean
  className?: string
}

export function Logo({ href, size = 'md', priority = false, className }: LogoProps) {
  const px = SIZES[size]

  const img = (
    <Image
      src="/IMG_4472.PNG"
      alt="jufoods sweets"
      width={px}
      height={px}
      priority={priority}
      className={cn('object-contain shrink-0', className)}
      style={{ width: px, height: px }}
    />
  )

  if (!href) return img

  return (
    <Link
      href={href}
      className="hover:opacity-80 transition-opacity shrink-0"
      aria-label="jufoods – Zur Startseite"
    >
      {img}
    </Link>
  )
}
