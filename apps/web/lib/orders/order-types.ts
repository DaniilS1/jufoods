/** Shared types for order API, webhooks, and admin enrichment. */

export type OrderLocale = 'de' | 'uk'

export type CheckoutSalutation = 'mr' | 'mrs'

export interface CheckoutContactPayload {
  salutation: CheckoutSalutation
  firstName: string
  lastName: string
  phone: string
  consentWhatsapp: boolean
  consentTelegram: boolean
  messengerSameAsPhone: boolean
  messengerPhone?: string | null
}

export interface CheckoutPayload {
  contact?: CheckoutContactPayload
  orderDetails?: {
    eventDate?: string
    eventTime?: string
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
  /** Custom torte: count of customer-uploaded design images */
  customImageCount?: number
  /** Custom torte: customer-uploaded design image URLs */
  customImageUrls?: string[]
  /** Custom torte: free-text design description */
  customDesignNote?: string
}
