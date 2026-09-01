import { createHmac } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import * as z from 'zod'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const contactRequestSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  message: z.string().trim().min(10),
  locale: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request)
    const ipAllowed = await checkRateLimit(`contact:ip:${clientIp}`, 5, 10 * 60)
    if (!ipAllowed) {
      return NextResponse.json({ error: 'Too many requests, please try again later' }, { status: 429 })
    }

    const rawBody = await request.json()
    const parsed = contactRequestSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid contact payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const url = process.env.CONTACT_WEBHOOK_URL?.trim()
    if (!url) {
      console.error('[contact] CONTACT_WEBHOOK_URL is not set — message cannot be delivered')
      return NextResponse.json({ error: 'Contact form is not configured' }, { status: 503 })
    }

    const body = JSON.stringify({
      event: 'contact.submitted',
      version: 1,
      ...parsed.data,
    })
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Jufoods-Event': 'contact.submitted',
    }
    const secret = process.env.CONTACT_WEBHOOK_SECRET?.trim()
    if (secret) {
      headers['X-Jufoods-Signature'] = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`
    }

    const controller = new AbortController()
    const timeoutMs = Math.min(Math.max(Number(process.env.CONTACT_WEBHOOK_TIMEOUT_MS) || 8000, 2000), 30000)
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(url, { method: 'POST', body, headers, signal: controller.signal })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        console.error('[contact] Webhook HTTP error', res.status, text.slice(0, 500))
        return NextResponse.json({ error: 'Failed to deliver message' }, { status: 502 })
      }
    } catch (e) {
      console.error('[contact] Webhook request failed:', e instanceof Error ? e.message : String(e))
      return NextResponse.json({ error: 'Failed to deliver message' }, { status: 502 })
    } finally {
      clearTimeout(timeout)
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Contact submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
