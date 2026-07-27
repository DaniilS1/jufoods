import { z } from 'zod'

/**
 * Server-side mirror of the checkout form's Zod schema (components/checkout-client.tsx).
 * The client already validates this shape; this schema exists so a request sent
 * directly to /api/orders (bypassing the UI) can't persist malformed data —
 * previously only "is items a non-empty array" and "is email/name non-empty"
 * were checked here.
 */

const MAX_ITEMS = 50
const MAX_QUANTITY = 99
const MAX_TEXT = 2000

const isoDateString = z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
  message: 'Invalid date',
})

const lineItemSchema = z.object({
  productId: z.string().trim().min(1).max(200),
  designId: z.string().trim().max(200).nullable().optional(),
  quantity: z.number().int().min(1).max(MAX_QUANTITY),
  productName: z.string().trim().max(200).optional(),
  deliveryDate: z.string().trim().max(40).optional(),
  personCount: z.number().int().min(1).max(1000).optional(),
  customImageUrls: z.array(z.string().url().max(2000)).max(10).optional(),
  customDesignNote: z.string().trim().max(MAX_TEXT).optional(),
})

const customerSchema = z.object({
  salutation: z.enum(['mr', 'mrs']).optional(),
  firstName: z.string().trim().max(120).optional(),
  lastName: z.string().trim().max(120).optional(),
  fullName: z.string().trim().max(240).optional(),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(40).optional(),
  phoneOrSocial: z.string().trim().max(40).optional(),
  consentWhatsapp: z.boolean().optional(),
  consentTelegram: z.boolean().optional(),
  messengerPhone: z.string().trim().max(40).nullable().optional(),
  residenceCity: z.string().trim().max(160).optional(),
  referralSource: z.string().trim().max(80).optional(),
})

const orderDetailsSchema = z
  .object({
    eventDate: isoDateString.optional(),
    eventTime: z.string().trim().max(40).optional(),
    celebrationDate: isoDateString.optional(),
    timeNeeded: z.string().trim().max(40).optional(),
    remarks: z.string().trim().max(MAX_TEXT).optional(),
  })
  .optional()

const deliverySchema = z
  .object({
    pickupOrDelivery: z.enum(['pickup', 'delivery']).optional(),
    deliveryStreet: z.string().trim().max(200).optional(),
    deliveryPostalCode: z.string().trim().max(20).optional(),
    deliveryCity: z.string().trim().max(160).optional(),
    deliveryAddress: z.string().trim().max(400).nullable().optional(),
  })
  .optional()
  .refine(
    (d) =>
      !d ||
      d.pickupOrDelivery !== 'delivery' ||
      (d.deliveryStreet?.trim() && d.deliveryPostalCode?.trim() && d.deliveryCity?.trim()),
    { message: 'Delivery address is required when pickupOrDelivery is "delivery"' }
  )

export const orderRequestSchema = z.object({
  locale: z.enum(['de', 'uk']).optional(),
  items: z.array(lineItemSchema).min(1).max(MAX_ITEMS),
  customer: customerSchema,
  orderDetails: orderDetailsSchema,
  delivery: deliverySchema,
  customDesignId: z.string().uuid().optional().nullable(),
})

export type OrderRequestBody = z.infer<typeof orderRequestSchema>
