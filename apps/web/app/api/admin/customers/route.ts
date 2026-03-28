import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export async function GET() {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status })
  }

  const { data, error } = await gate.supabase
    .from('customers')
    .select(
      'id, display_email, full_name, order_count, last_order_at, first_order_at, user_id, phone_or_social, residence_city'
    )
    .order('last_order_at', { ascending: false })

  if (error) {
    console.error('GET /api/admin/customers', error)
    return NextResponse.json({ error: 'Failed to load customers' }, { status: 500 })
  }

  return NextResponse.json({ customers: data ?? [] })
}
