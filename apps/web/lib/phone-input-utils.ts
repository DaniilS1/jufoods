/** Merge ITU-T dial code and national digits for storage / API (single string). */
export function formatInternationalPhone(dialCode: string, nationalPart: string): string {
  const dial = dialCode.trim()
  const raw = nationalPart.replace(/[\s\-/.]/g, '').trim()
  const withoutLeadingZeros = raw.replace(/^0+/, '')
  if (!dial || !withoutLeadingZeros) return ''
  return `${dial} ${withoutLeadingZeros}`.trim()
}

export const CHECKOUT_PHONE_DIAL_ORDER = [
  '+49',
  '+380',
  '+43',
  '+41',
  '+48',
  '+31',
  '+33',
  '+1',
  '+44',
] as const

export type CheckoutDialCode = (typeof CHECKOUT_PHONE_DIAL_ORDER)[number]

/** Default dial code from shop locale (uk → Ukraine, else Germany). */
export function defaultDialCodeForLocale(locale: string): string {
  return locale === 'uk' ? '+380' : '+49'
}
