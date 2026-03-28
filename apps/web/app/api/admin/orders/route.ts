import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export async function GET() {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status })
  }

  const { data, error } = await gate.supabase
    .from('orders')
    .select(
      'id, created_at, status, customer_name, customer_email, customer_id, items, notes, checkout_details'
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('GET /api/admin/orders', error)
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 })
  }

  return NextResponse.json({ orders: data ?? [] })
}
