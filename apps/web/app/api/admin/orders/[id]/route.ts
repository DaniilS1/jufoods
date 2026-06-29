import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

const ALLOWED_STATUS = ['pending', 'confirmed', 'completed', 'cancelled'] as const

type RawLine = {
  productId?: string
  product_id?: string
  designId?: string | null
  design_id?: string | null
  quantity?: number
  productName?: string
  customImageUrls?: string[]
  customDesignNote?: string
}

function isCustomLine(line: RawLine): boolean {
  const pid = line.productId || line.product_id
  return (typeof pid === 'string' && pid.startsWith('custom')) || (Array.isArray(line.customImageUrls) && line.customImageUrls.length > 0)
}

function pickImageUrl(row: {
  image_url?: string | null
  images_urls?: string[] | null
}): string | null {
  if (row.image_url) return row.image_url
  const arr = row.images_urls
  if (Array.isArray(arr) && arr[0]) return arr[0]
  return null
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status })
  }

  const id = params.id
  if (!id) {
    return NextResponse.json({ error: 'Missing order id' }, { status: 400 })
  }

  const { data: order, error } = await gate.supabase.from('orders').select('*').eq('id', id).maybeSingle()

  if (error) {
    console.error('GET /api/admin/orders/[id]', error)
    return NextResponse.json({ error: 'Failed to load order' }, { status: 500 })
  }

  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const items = Array.isArray(order.items) ? (order.items as RawLine[]) : []
  const productIds = [
    ...new Set(
      items
        .filter((i) => !isCustomLine(i))
        .map((i) => i.productId || i.product_id)
        .filter(Boolean) as string[]
    ),
  ]
  const designIds = [...new Set(items.map((i) => i.designId || i.design_id).filter(Boolean) as string[])]

  const [productsRes, designsRes] = await Promise.all([
    productIds.length
      ? gate.supabase
          .from('products')
          .select('id, name_de, name_uk, image_url, images_urls')
          .in('id', productIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    designIds.length
      ? gate.supabase
          .from('torten_designs')
          .select('id, name_de, name_uk, image_url, images_urls')
          .in('id', designIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ])

  const productMap = new Map<string, Record<string, unknown>>()
  for (const p of productsRes.data ?? []) {
    if (p && typeof p.id === 'string') productMap.set(p.id, p)
  }
  const designMap = new Map<string, Record<string, unknown>>()
  for (const d of designsRes.data ?? []) {
    if (d && typeof d.id === 'string') designMap.set(d.id, d)
  }

  const enrichedItems = items.map((line) => {
    const pid = (line.productId || line.product_id) as string | undefined
    const did = (line.designId || line.design_id) as string | null | undefined
    const custom = isCustomLine(line)
    const product = !custom && pid ? productMap.get(pid) : undefined
    const design = did ? designMap.get(did) : undefined
    const customImageUrls = Array.isArray(line.customImageUrls) ? line.customImageUrls : []
    const customName = typeof line.productName === 'string' && line.productName.trim() ? line.productName.trim() : null
    return {
      productId: pid ?? '',
      designId: did ?? null,
      quantity: Math.max(1, line.quantity ?? 1),
      productName_de: custom ? customName : (product?.name_de as string) ?? null,
      productName_uk: custom ? customName : (product?.name_uk as string) ?? null,
      designName_de: (design?.name_de as string) ?? null,
      designName_uk: (design?.name_uk as string) ?? null,
      productImageUrl: custom
        ? customImageUrls[0] ?? null
        : product
          ? pickImageUrl(product as { image_url?: string; images_urls?: string[] })
          : null,
      designImageUrl: design ? pickImageUrl(design as { image_url?: string; images_urls?: string[] }) : null,
      isCustom: custom,
      customImageUrls,
      customDesignNote: typeof line.customDesignNote === 'string' ? line.customDesignNote : null,
    }
  })

  return NextResponse.json({ order, enrichedItems })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status })
  }

  const id = params.id
  if (!id) {
    return NextResponse.json({ error: 'Missing order id' }, { status: 400 })
  }

  let body: { status?: string; notes?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { status, notes } = body
  if (status === undefined && notes === undefined) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (status !== undefined) {
    if (!ALLOWED_STATUS.includes(status as (typeof ALLOWED_STATUS)[number])) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    updatePayload.status = status
  }
  if (notes !== undefined) {
    updatePayload.notes = notes
  }

  const { data, error } = await gate.supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', id)
    .select('id, status, notes, updated_at')
    .single()

  if (error) {
    console.error('PATCH /api/admin/orders/[id]', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }

  return NextResponse.json({ order: data })
}
