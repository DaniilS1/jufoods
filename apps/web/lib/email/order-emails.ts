import nodemailer from 'nodemailer'
import { format } from 'date-fns'
import { de, uk } from 'date-fns/locale'

export type OrderLocale = 'de' | 'uk'

export interface CheckoutPayload {
  orderDetails?: {
    eventDate?: string
    celebrationDate?: string
    timeNeeded?: string
    remarks?: string
  }
  delivery?: {
    pickupOrDelivery?: 'pickup' | 'delivery'
    deliveryStreet?: string
    deliveryPostalCode?: string
    deliveryCity?: string
    deliveryAddress?: string | null
  }
  referralSource?: string
  residenceCity?: string
}

export interface EnrichedLineItem {
  quantity: number
  productName: string
  designName: string | null
}

const LOGO_URL =
  'https://jufoods-sweets.com/_next/image?url=%2FIMG_4472.PNG&w=96&q=75'

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function dateLocale(loc: OrderLocale) {
  return loc === 'uk' ? uk : de
}

function formatDate(iso: string | undefined, loc: OrderLocale): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return format(d, 'dd.MM.yyyy', { locale: dateLocale(loc) })
  } catch {
    return iso
  }
}

function wrapEmail(innerTitle: string, innerBodyHtml: string, lang: OrderLocale): string {
  const langAttr = lang === 'uk' ? 'uk' : 'de'
  return `<!DOCTYPE html>
<html lang="${langAttr}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(innerTitle)} — jufoods</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5ebe9; color: #5c4d4d; line-height: 1.5; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5ebe9;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #f8f3f1; border-radius: 12px; box-shadow: 0 4px 6px rgba(92, 77, 77, 0.08); overflow: hidden;">
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #f8f3f1 0%, #f0e6e2 100%); border-bottom: 1px solid #e5d9d4;">
              <div style="display: inline-block; width: 48px; height: 48px; border-radius: 50%; overflow: hidden; margin-bottom: 4px;">
                <img src="${LOGO_URL}" alt="jufoods" width="48" height="48" style="display: block; width: 48px; height: 48px; object-fit: cover;">
              </div>
              <p style="margin: 4px 0 0; font-size: 13px; color: #8a7a75;">
                ${lang === 'uk' ? 'Торти та десерти ручної роботи' : 'Handgemachte Torten und Desserts'}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              ${innerBodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; background-color: #f0e6e2; border-top: 1px solid #e5d9d4; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #8a7a75;">
                © jufoods · ${lang === 'uk' ? 'Усі права захищені' : 'Alle Rechte vorbehalten'}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function linesTableHtml(lines: EnrichedLineItem[], loc: OrderLocale): string {
  const thProduct = loc === 'uk' ? 'Позиція' : 'Position'
  const thQty = loc === 'uk' ? 'Кількість' : 'Menge'
  const rows = lines
    .map(
      (l) => `
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5d9d4; font-size: 14px;">
        <strong>${escapeHtml(l.productName)}</strong>
        ${l.designName ? `<br><span style="color:#8a7a75;font-size:13px;">${escapeHtml(l.designName)}</span>` : ''}
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5d9d4; font-size: 14px; text-align: center;">${l.quantity}</td>
    </tr>`
    )
    .join('')

  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 16px 0 0; border-collapse: collapse;">
    <tr style="background-color: #f0e6e2;">
      <th align="left" style="padding: 10px 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #8a7a75;">${thProduct}</th>
      <th style="padding: 10px 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #8a7a75; width: 72px;">${thQty}</th>
    </tr>
    ${rows}
  </table>`
}

function detailRow(label: string, value: string): string {
  return `
  <p style="margin: 0 0 8px; font-size: 14px;">
    <span style="color: #8a7a75;">${escapeHtml(label)}</span><br>
    <span style="font-weight: 500;">${escapeHtml(value)}</span>
  </p>`
}

export function buildOrderSummarySection(
  orderIdShort: string,
  customerName: string,
  customerEmail: string,
  phoneOrSocial: string,
  checkout: CheckoutPayload,
  lines: EnrichedLineItem[],
  notesPlain: string | null,
  loc: OrderLocale
): string {
  const od = checkout.orderDetails ?? {}
  const del = checkout.delivery ?? {}
  const pickupLabel = loc === 'uk' ? 'Самовивіз' : 'Abholung'
  const deliveryLabel = loc === 'uk' ? 'Доставка' : 'Lieferung'
  const mode =
    del.pickupOrDelivery === 'delivery' ? deliveryLabel : pickupLabel

  let address = ''
  if (del.pickupOrDelivery === 'delivery') {
    address =
      del.deliveryAddress ||
      [del.deliveryStreet, del.deliveryPostalCode, del.deliveryCity].filter(Boolean).join(', ')
  } else {
    address = checkout.residenceCity || '—'
  }

  const referral = checkout.referralSource || '—'
  const celebration =
    formatDate(od.celebrationDate, loc) +
    (od.timeNeeded ? (loc === 'uk' ? ` · ${od.timeNeeded}` : ` · ${od.timeNeeded} Uhr`) : '')

  const lOrderId = loc === 'uk' ? 'Номер замовлення' : 'Bestellnummer'
  const lName = loc === 'uk' ? 'Ім’я' : 'Name'
  const lEmail = 'E-mail'
  const lPhone = loc === 'uk' ? 'Телефон / соцмережі' : 'Telefon / Social'
  const lEvent = loc === 'uk' ? 'Дата події' : 'Eventdatum'
  const lCelebration = loc === 'uk' ? 'Дата святкування та час' : 'Feierdatum & Uhrzeit'
  const lDelivery = loc === 'uk' ? 'Доставка' : 'Lieferung / Abholung'
  const lAddr = loc === 'uk' ? 'Адреса / місто' : 'Adresse / Wohnort'
  const lRef = loc === 'uk' ? 'Звідки дізналися' : 'Referenz'
  const lItems = loc === 'uk' ? 'Склад замовлення' : 'Bestellpositionen'
  const lNotes = loc === 'uk' ? 'Примітки' : 'Anmerkungen'

  const parts = [
    `<h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #5c4d4d;">#${escapeHtml(orderIdShort)}</h2>`,
    detailRow(lOrderId, orderIdShort),
    detailRow(lName, customerName),
    detailRow(lEmail, customerEmail),
    detailRow(lPhone, phoneOrSocial || '—'),
    detailRow(lEvent, formatDate(od.eventDate, loc)),
    detailRow(lCelebration, celebration),
    detailRow(lDelivery, mode),
    detailRow(lAddr, address || '—'),
    detailRow(lRef, referral),
    `<p style="margin: 20px 0 8px; font-size: 13px; font-weight: 600; color: #5c4d4d;">${lItems}</p>`,
    linesTableHtml(lines, loc),
  ]

  if (notesPlain?.trim()) {
    parts.push(`<p style="margin: 20px 0 8px; font-size: 13px; font-weight: 600; color: #5c4d4d;">${lNotes}</p>`)
    parts.push(`<p style="margin: 0; font-size: 14px; white-space: pre-wrap;">${escapeHtml(notesPlain.trim())}</p>`)
  }

  return parts.join('\n')
}

export function buildManagerEmailHtml(
  orderId: string,
  customerName: string,
  customerEmail: string,
  phoneOrSocial: string,
  checkout: CheckoutPayload,
  lines: EnrichedLineItem[],
  notesPlain: string | null,
  loc: OrderLocale
): string {
  const short = orderId.slice(0, 8).toUpperCase()
  const title = loc === 'uk' ? 'Нове замовлення' : 'Neue Bestellung'
  const intro =
    loc === 'uk'
      ? 'Надійшло нове замовлення. Деталі нижче.'
      : 'Es ist eine neue Bestellung eingegangen. Details siehe unten.'

  const body = `
    <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #5c4d4d;">${title}</h2>
    <p style="margin: 0 0 24px; font-size: 15px; color: #5c4d4d;">${intro}</p>
    ${buildOrderSummarySection(short, customerName, customerEmail, phoneOrSocial, checkout, lines, notesPlain, loc)}
  `
  return wrapEmail(`${title} #${short}`, body, loc)
}

export function buildCustomerEmailHtml(
  orderId: string,
  customerName: string,
  customerEmail: string,
  phoneOrSocial: string,
  checkout: CheckoutPayload,
  lines: EnrichedLineItem[],
  notesPlain: string | null,
  loc: OrderLocale
): string {
  const short = orderId.slice(0, 8).toUpperCase()
  const title = loc === 'uk' ? 'Дякуємо за замовлення!' : 'Vielen Dank für Ihre Bestellung!'
  const intro =
    loc === 'uk'
      ? `Вітаємо, ${escapeHtml(customerName)}! Ми отримали ваше замовлення і зв’яжемося з вами найближчим часом.`
      : `Hallo ${escapeHtml(customerName)}, wir haben Ihre Bestellung erhalten und melden uns bei Ihnen.`

  const body = `
    <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #5c4d4d;">${title}</h2>
    <p style="margin: 0 0 24px; font-size: 15px; color: #5c4d4d;">${intro}</p>
    ${buildOrderSummarySection(short, customerName, customerEmail, phoneOrSocial, checkout, lines, notesPlain, loc)}
  `
  return wrapEmail(`${title} #${short}`, body, loc)
}

function createTransporter() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) {
    return null
  }
  const secure =
    process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1' || port === 465
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })
}

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM
  )
}

export async function sendOrderNotificationEmails(params: {
  orderId: string
  managerTo: string
  customerTo: string
  from: string
  customerName: string
  customerEmail: string
  phoneOrSocial: string
  checkout: CheckoutPayload
  lines: EnrichedLineItem[]
  notesPlain: string | null
  locale: OrderLocale
}): Promise<void> {
  const transporter = createTransporter()
  if (!transporter) {
    console.warn('[orders] SMTP not fully configured; skipping emails')
    return
  }

  const short = params.orderId.slice(0, 8).toUpperCase()
  const loc = params.locale

  const managerSubject =
    loc === 'uk' ? `Нове замовлення #${short}` : `Neue Bestellung #${short}`
  const customerSubject =
    loc === 'uk'
      ? `Ваше замовлення jufoods #${short}`
      : `Ihre Bestellung bei jufoods #${short}`

  await transporter.sendMail({
    from: params.from,
    to: params.managerTo,
    subject: managerSubject,
    html: buildManagerEmailHtml(
      params.orderId,
      params.customerName,
      params.customerEmail,
      params.phoneOrSocial,
      params.checkout,
      params.lines,
      params.notesPlain,
      loc
    ),
  })

  await transporter.sendMail({
    from: params.from,
    to: params.customerTo,
    subject: customerSubject,
    html: buildCustomerEmailHtml(
      params.orderId,
      params.customerName,
      params.customerEmail,
      params.phoneOrSocial,
      params.checkout,
      params.lines,
      params.notesPlain,
      loc
    ),
  })
}
