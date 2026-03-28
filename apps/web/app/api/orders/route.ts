import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import {
  sendOrderNotificationEmails,
  type CheckoutPayload,
  type EnrichedLineItem,
  type OrderLocale,
} from '@/lib/email/order-emails'

type RawItem = {
  productId?: string
  designId?: string | null
  quantity?: number
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function buildCustomerAddress(
  delivery: CheckoutPayload['delivery'],
  residenceCity: string | null | undefined
): string | null {
  if (!delivery) return residenceCity?.trim() || null
  if (delivery.pickupOrDelivery === 'delivery') {
    const line =
      delivery.deliveryAddress ||
      [delivery.deliveryStreet, delivery.deliveryPostalCode, delivery.deliveryCity].filter(Boolean).join(', ')
    return line?.trim() || null
  }
  return residenceCity?.trim() || null
}

async function enrichLineItems(
  admin: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  items: RawItem[],
  locale: OrderLocale
): Promise<EnrichedLineItem[]> {
  const productIds = [...new Set(items.map((i) => i.productId).filter(Boolean) as string[])]
  const designIds = [...new Set(items.map((i) => i.designId).filter(Boolean) as string[])]

  const [productsRes, designsRes] = await Promise.all([
    productIds.length
      ? admin.from('products').select('id, name_de, name_uk').in('id', productIds)
      : Promise.resolve({ data: [] as { id: string; name_de: string; name_uk: string }[] }),
    designIds.length
      ? admin.from('torten_designs').select('id, name_de, name_uk').in('id', designIds)
      : Promise.resolve({ data: [] as { id: string; name_de: string; name_uk: string }[] }),
  ])

  const productMap = new Map<string, string>()
  for (const p of productsRes.data ?? []) {
    const label = locale === 'uk' ? p.name_uk : p.name_de
    productMap.set(p.id, label || '—')
  }
  const designMap = new Map<string, string>()
  for (const d of designsRes.data ?? []) {
    const label = locale === 'uk' ? d.name_uk : d.name_de
    designMap.set(d.id, label || '—')
  }

  return items.map((item) => {
    const pid = item.productId
    const did = item.designId
    return {
      quantity: Math.max(1, item.quantity ?? 1),
      productName: pid ? productMap.get(pid) ?? pid.slice(0, 8) : '—',
      designName: did ? designMap.get(did) ?? null : null,
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, customer, orderDetails, delivery, customDesignId, locale: localeRaw } = body

    const locale: OrderLocale = localeRaw === 'uk' ? 'uk' : 'de'

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 })
    }

    if (!customer?.fullName || !customer?.email) {
      return NextResponse.json({ error: 'Full name and email are required' }, { status: 400 })
    }

    const admin = createServiceRoleClient()
    if (!admin) {
      console.error('SUPABASE_SERVICE_ROLE_KEY or URL missing')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabaseUser = await createClient()
    const {
      data: { user },
    } = await supabaseUser.auth.getUser()

    const emailNormalized = normalizeEmail(customer.email)
    const displayEmail = customer.email.trim()
    const residenceCity = customer.residenceCity?.trim() || null
    const phoneOrSocial = customer.phoneOrSocial?.trim() || null

    const checkoutDetails: CheckoutPayload = {
      orderDetails: orderDetails || {},
      delivery: delivery || {},
      referralSource: customer.referralSource || undefined,
      residenceCity: residenceCity || undefined,
    }

    const remarksText =
      typeof orderDetails?.remarks === 'string' && orderDetails.remarks.trim()
        ? orderDetails.remarks.trim()
        : null

    const { data: existingCustomer, error: findErr } = await admin
      .from('customers')
      .select('id, order_count, user_id')
      .eq('email_normalized', emailNormalized)
      .maybeSingle()

    if (findErr) {
      console.error('Customer lookup error:', findErr)
      return NextResponse.json({ error: 'Failed to process customer' }, { status: 500 })
    }

    const now = new Date().toISOString()
    const linkedUserId = user?.id ?? null
    let customerId: string

    if (!existingCustomer) {
      const { data: inserted, error: insErr } = await admin
        .from('customers')
        .insert({
          email_normalized: emailNormalized,
          display_email: displayEmail,
          full_name: customer.fullName.trim(),
          phone_or_social: phoneOrSocial,
          residence_city: residenceCity,
          user_id: linkedUserId,
          first_order_at: now,
          last_order_at: now,
          order_count: 1,
        })
        .select('id')
        .single()

      if (insErr || !inserted) {
        console.error('Customer insert error:', insErr)
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
      }
      customerId = inserted.id
    } else {
      const nextUserId = existingCustomer.user_id ?? linkedUserId
      const { error: upErr } = await admin
        .from('customers')
        .update({
          display_email: displayEmail,
          full_name: customer.fullName.trim(),
          phone_or_social: phoneOrSocial,
          residence_city: residenceCity,
          user_id: nextUserId,
          last_order_at: now,
          order_count: existingCustomer.order_count + 1,
        })
        .eq('id', existingCustomer.id)

      if (upErr) {
        console.error('Customer update error:', upErr)
        return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
      }
      customerId = existingCustomer.id
    }

    const customerAddress = buildCustomerAddress(delivery, residenceCity)

    const { data: order, error: dbError } = await admin
      .from('orders')
      .insert({
        user_id: user?.id || null,
        customer_id: customerId,
        customer_name: customer.fullName.trim(),
        customer_email: displayEmail,
        customer_phone: phoneOrSocial,
        customer_address: customerAddress,
        notes: remarksText,
        checkout_details: checkoutDetails,
        items: items,
        status: 'pending',
        custom_design_id: customDesignId || null,
      })
      .select()
      .single()

    if (dbError || !order) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    const enrichedLines = await enrichLineItems(admin, items as RawItem[], locale)

    try {
      const managerTo = process.env.ORDER_EMAIL || process.env.SMTP_FROM
      const from = process.env.SMTP_FROM
      if (managerTo && from) {
        await sendOrderNotificationEmails({
          orderId: order.id,
          managerTo,
          customerTo: displayEmail,
          from,
          customerName: customer.fullName.trim(),
          customerEmail: displayEmail,
          phoneOrSocial: phoneOrSocial || '',
          checkout: checkoutDetails,
          lines: enrichedLines,
          notesPlain: remarksText,
          locale,
        })
      } else {
        console.warn('[orders] ORDER_EMAIL or SMTP_FROM missing; skipping emails')
      }
    } catch (emailError) {
      console.error('Email error (non-critical):', emailError)
    }

    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 })
  } catch (error) {
    console.error('Order submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
