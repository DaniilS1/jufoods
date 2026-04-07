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

/**
 * POSTs to ORDER_WEBHOOK_URL after the order exists in the DB.
 * Fire-and-forget from the route handler; failures are logged only (order already persisted).
 */
export async function sendOrderCreatedWebhook(payload: OrderCreatedWebhookPayload): Promise<void> {
  const url = process.env.ORDER_WEBHOOK_URL?.trim()
  if (!url) return

  const body = JSON.stringify(payload)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Jufoods-Event': payload.event,
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
      console.error('[orders] Webhook HTTP error', res.status, text.slice(0, 500))
    }
  } catch (e) {
    console.error('[orders] Webhook request failed:', e)
  } finally {
    clearTimeout(timeout)
  }
}
