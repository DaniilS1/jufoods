import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import type { CheckoutPayload, EnrichedLineItem, OrderLocale } from '@/lib/orders/order-types'
import { sendOrderCreatedWebhook } from '@/lib/orders/order-webhook'

type RawItem = {
  productId?: string
  product_id?: string
  designId?: string | null
  design_id?: string | null
  quantity?: number
  productName?: string
  customImageUrls?: string[]
  customDesignNote?: string
}

function isCustomItem(item: RawItem): boolean {
  const pid = item.productId ?? item.product_id
  return typeof pid === 'string' && pid.startsWith('custom')
}

function lineProductId(item: RawItem): string | undefined {
  const v = item.productId ?? item.product_id
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

function lineDesignId(item: RawItem): string | null | undefined {
  const v = item.designId ?? item.design_id
  if (v === null || v === undefined) return v
  return typeof v === 'string' && v.trim() ? v.trim() : null
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
  const productIds = [
    ...new Set(items.filter((i) => !isCustomItem(i)).map(lineProductId).filter(Boolean) as string[]),
  ]
  const designIds = [...new Set(items.map((i) => lineDesignId(i)).filter(Boolean) as string[])]

  const [productsRes, designsRes] = await Promise.all([
    productIds.length
      ? admin.from('products').select('id, name_de, name_uk').in('id', productIds)
      : Promise.resolve({ data: [] as { id: string; name_de: string; name_uk: string }[], error: null }),
    designIds.length
      ? admin.from('torten_designs').select('id, name_de, name_uk').in('id', designIds)
      : Promise.resolve({ data: [] as { id: string; name_de: string; name_uk: string }[], error: null }),
  ])

  if (productsRes.error) {
    console.error('[orders] enrichLineItems products query:', productsRes.error.message)
  }
  if (designsRes.error) {
    console.error('[orders] enrichLineItems designs query:', designsRes.error.message)
  }

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
    const pid = lineProductId(item)
    const did = lineDesignId(item)
    if (isCustomItem(item)) {
      const imageUrls = Array.isArray(item.customImageUrls) ? item.customImageUrls : []
      return {
        quantity: Math.max(1, item.quantity ?? 1),
        productName: item.productName?.trim() || (locale === 'uk' ? 'Власний дизайн' : 'Eigenes Design'),
        designName: did ? designMap.get(did) ?? null : null,
        customImageCount: imageUrls.length,
        customImageUrls: imageUrls,
        customDesignNote: item.customDesignNote?.trim() || undefined,
      }
    }
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

    const emailRaw = typeof customer?.email === 'string' ? customer.email.trim() : ''
    const firstName = typeof customer?.firstName === 'string' ? customer.firstName.trim() : ''
    const lastName = typeof customer?.lastName === 'string' ? customer.lastName.trim() : ''
    let fullName =
      typeof customer?.fullName === 'string' ? customer.fullName.trim() : `${firstName} ${lastName}`.trim()
    if (!fullName && (firstName || lastName)) {
      fullName = `${firstName} ${lastName}`.trim()
    }
    if (!emailRaw || !fullName) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
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

    const emailNormalized = normalizeEmail(emailRaw)
    const displayEmail = emailRaw
    const residenceCity = customer.residenceCity?.trim() || null
    const phone =
      (typeof customer?.phone === 'string' ? customer.phone.trim() : '') ||
      (typeof customer?.phoneOrSocial === 'string' ? customer.phoneOrSocial.trim() : '') ||
      null

    const salutation: 'mr' | 'mrs' = customer?.salutation === 'mrs' ? 'mrs' : 'mr'
    const consentWhatsapp = Boolean(customer?.consentWhatsapp)
    const consentTelegram = Boolean(customer?.consentTelegram)
    const hasMessengerConsent = consentWhatsapp || consentTelegram
    const messengerPhoneRaw =
      typeof customer?.messengerPhone === 'string' ? customer.messengerPhone.trim() : ''
    const messengerPhone = hasMessengerConsent && messengerPhoneRaw ? messengerPhoneRaw : null
    const messengerSameAsPhone = !hasMessengerConsent || !messengerPhoneRaw

    const nameParts = fullName.split(/\s+/).filter(Boolean)
    const resolvedFirst = firstName || nameParts[0] || fullName
    const resolvedLast =
      lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '')

    const contactPayload = {
      salutation,
      firstName: resolvedFirst,
      lastName: resolvedLast,
      phone: phone ?? '',
      consentWhatsapp,
      consentTelegram,
      messengerSameAsPhone,
      messengerPhone,
    }

    const checkoutDetails: CheckoutPayload = {
      contact: contactPayload,
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
          full_name: fullName,
          phone_or_social: phone,
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
          full_name: fullName,
          phone_or_social: phone,
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
        customer_name: fullName,
        customer_email: displayEmail,
        customer_phone: phone,
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

    if (!process.env.ORDER_WEBHOOK_URL?.trim()) {
      console.warn(
        '[orders] ORDER_WEBHOOK_URL is not set; order was saved but no notification webhook was sent (configure n8n URL).'
      )
    }
    void sendOrderCreatedWebhook({
      event: 'order.created',
      version: 1,
      order: order as Record<string, unknown>,
      customerId,
      enrichedLines,
      locale,
    })

    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 })
  } catch (error) {
    console.error('Order submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
