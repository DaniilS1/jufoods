'use client'

import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'

type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

const STATUS_VARIANT: Record<OrderStatus, 'warning' | 'success' | 'secondary' | 'destructive'> = {
  pending: 'warning',
  confirmed: 'success',
  completed: 'secondary',
  cancelled: 'destructive',
}

interface AdminStatusBadgeProps {
  status: OrderStatus
  className?: string
}

export function AdminStatusBadge({ status, className }: AdminStatusBadgeProps) {
  const t = useTranslations('account.orderStatus')
  return (
    <Badge variant={STATUS_VARIANT[status]} className={className}>
      {t(status)}
    </Badge>
  )
}
