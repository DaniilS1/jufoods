import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchRecentOrders } from '@/lib/supabase/account'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limitParam = Number(request.nextUrl.searchParams.get('limit') || 5)
    const limit = Number.isNaN(limitParam) ? 5 : Math.min(Math.max(limitParam, 1), 20)

    const orders = await fetchRecentOrders(supabase, user.id, limit)

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order.id,
        status: order.status,
        createdAt: order.created_at,
        items: order.items ?? [],
      })),
    })
  } catch (error) {
    console.error('GET /api/account/orders', error)
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 })
  }
}



