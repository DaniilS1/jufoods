import { createHmac } from 'crypto'
import type { EnrichedLineItem, OrderLocale } from '@/lib/orders/order-types'

/** Payload for n8n / external automations (email, WhatsApp, Telegram, CRM, …). */
export type OrderCreatedWebhookPayload = {
  event: 'order.created'
  version: 1
  /** Full row as returned from `orders.insert` — source of truth IDs and JSON fields. */
  order: Record<string, unknown>
  customerId: string
  /** Human-readable line items (names resolved server-side). */
  enrichedLines: EnrichedLineItem[]
  locale: OrderLocale
}

export type WebhookDeliveryResult =
  | { delivered: true }
  | { delivered: false; error: string }

/**
 * POSTs to ORDER_WEBHOOK_URL after the order exists in the DB. Awaited by the
 * caller (the order is already persisted either way) so the delivery outcome
 * can be recorded on the order row — a silent failure here previously meant
 * nobody, not the shop owner nor the admin panel, ever found out an order
 * notification never went out.
 */
export async function sendOrderCreatedWebhook(
  payload: OrderCreatedWebhookPayload
): Promise<WebhookDeliveryResult> {
  const url = process.env.ORDER_WEBHOOK_URL?.trim()
  if (!url) return { delivered: false, error: 'ORDER_WEBHOOK_URL not configured' }

  const body = JSON.stringify(payload)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Jufoods-Event': payload.event,
  }

  const secret = process.env.ORDER_WEBHOOK_SECRET?.trim()
  if (secret) {
    headers['X-Jufoods-Signature'] = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`
  }

  const controller = new AbortController()
  const timeoutMs = Math.min(Math.max(Number(process.env.ORDER_WEBHOOK_TIMEOUT_MS) || 8000, 2000), 30000)
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      method: 'POST',
      body,
      headers,
      signal: controller.signal,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      const error = `HTTP ${res.status}: ${text.slice(0, 500)}`
      console.error('[orders] Webhook HTTP error', error)
      return { delivered: false, error }
    }
    return { delivered: true }
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    console.error('[orders] Webhook request failed:', error)
    return { delivered: false, error }
  } finally {
    clearTimeout(timeout)
  }
}
