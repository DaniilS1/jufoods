import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { orderRequestSchema, type OrderRequestBody } from '@/lib/orders/order-schema'
import type { CheckoutPayload, EnrichedLineItem, OrderLocale } from '@/lib/orders/order-types'
import { sendOrderCreatedWebhook } from '@/lib/orders/order-webhook'

type OrderLineInput = OrderRequestBody['items'][number]

function isCustomItem(item: OrderLineInput): boolean {
  return (
    item.productId.startsWith('custom') ||
    (Array.isArray(item.customImageUrls) && item.customImageUrls.length > 0)
  )
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
  items: OrderLineInput[],
  locale: OrderLocale
): Promise<EnrichedLineItem[]> {
  const productIds = [
    ...new Set(items.filter((i) => !isCustomItem(i)).map((i) => i.productId)),
  ]
  const designIds = [...new Set(items.map((i) => i.designId).filter(Boolean) as string[])]

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
    const pid = item.productId
    const did = item.designId ?? null
    const base = {
      quantity: item.quantity,
      designName: did ? designMap.get(did) ?? null : null,
      deliveryDate: item.deliveryDate ?? null,
      personCount: item.personCount ?? null,
    }
    if (isCustomItem(item)) {
      const imageUrls = item.customImageUrls ?? []
      return {
        ...base,
        productName: item.productName?.trim() || (locale === 'uk' ? 'Власний дизайн' : 'Eigenes Design'),
        customImageCount: imageUrls.length,
        customImageUrls: imageUrls,
        customDesignNote: item.customDesignNote?.trim() || undefined,
      }
    }
    return {
      ...base,
      productName: productMap.get(pid) ?? pid.slice(0, 8),
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request)
    const ipAllowed = await checkRateLimit(`orders:ip:${clientIp}`, 10, 10 * 60)
    if (!ipAllowed) {
      return NextResponse.json({ error: 'Too many requests, please try again later' }, { status: 429 })
    }

    const rawBody = await request.json()
    const parsed = orderRequestSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid order payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { items, customer, orderDetails, delivery, customDesignId, locale: localeRaw } = parsed.data

    const locale: OrderLocale = localeRaw === 'uk' ? 'uk' : 'de'

    const emailRaw = customer.email.trim()
    const emailNormalized = normalizeEmail(emailRaw)

    const emailAllowed = await checkRateLimit(`orders:email:${emailNormalized}`, 5, 10 * 60)
    if (!emailAllowed) {
      return NextResponse.json({ error: 'Too many requests, please try again later' }, { status: 429 })
    }

    const firstName = customer.firstName?.trim() || ''
    const lastName = customer.lastName?.trim() || ''
    let fullName = customer.fullName?.trim() || `${firstName} ${lastName}`.trim()
    if (!fullName && (firstName || lastName)) {
      fullName = `${firstName} ${lastName}`.trim()
    }
    if (!fullName) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
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

    const displayEmail = emailRaw
    const residenceCity = customer.residenceCity?.trim() || null
    const phone = customer.phone?.trim() || customer.phoneOrSocial?.trim() || null

    const salutation: 'mr' | 'mrs' = customer.salutation === 'mrs' ? 'mrs' : 'mr'
    const consentWhatsapp = Boolean(customer.consentWhatsapp)
    const consentTelegram = Boolean(customer.consentTelegram)
    const hasMessengerConsent = consentWhatsapp || consentTelegram
    const messengerPhoneRaw = customer.messengerPhone?.trim() ?? ''
    const messengerPhone = hasMessengerConsent && messengerPhoneRaw ? messengerPhoneRaw : null
    const messengerSameAsPhone = !hasMessengerConsent || !messengerPhoneRaw

    const nameParts = fullName.split(/\s+/).filter(Boolean)
    const resolvedFirst = firstName || nameParts[0] || fullName
    const resolvedLast = lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '')

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

    const remarksText = orderDetails?.remarks?.trim() || null
    const customerAddress = buildCustomerAddress(delivery, residenceCity)

    const { data: rpcData, error: rpcError } = await admin
      .rpc('create_order_with_customer', {
        p_email_normalized: emailNormalized,
        p_display_email: displayEmail,
        p_full_name: fullName,
        p_phone: phone,
        p_residence_city: residenceCity,
        p_user_id: user?.id ?? null,
        p_customer_address: customerAddress,
        p_notes: remarksText,
        p_checkout_details: checkoutDetails,
        p_items: items,
        p_custom_design_id: customDesignId || null,
      })
      .single()

    if (rpcError || !rpcData) {
      console.error('create_order_with_customer error:', rpcError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    const { order_id: orderId, customer_id: customerId } = rpcData as {
      order_id: string
      customer_id: string
    }

    const { data: order, error: fetchError } = await admin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      console.error('Order fetch-after-create error:', fetchError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    const enrichedLines = await enrichLineItems(admin, items, locale)

    if (!process.env.ORDER_WEBHOOK_URL?.trim()) {
      console.warn(
        '[orders] ORDER_WEBHOOK_URL is not set; order was saved but no notification webhook was sent (configure n8n URL).'
      )
    } else {
      const result = await sendOrderCreatedWebhook({
        event: 'order.created',
        version: 1,
        order: order as Record<string, unknown>,
        customerId,
        enrichedLines,
        locale,
      })

      await admin
        .from('orders')
        .update(
          result.delivered
            ? { webhook_delivered_at: new Date().toISOString(), webhook_last_error: null }
            : { webhook_last_error: result.error }
        )
        .eq('id', orderId)
    }

    return NextResponse.json({ success: true, orderId }, { status: 201 })
  } catch (error) {
    console.error('Order submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
