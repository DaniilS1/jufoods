/**
 * Maps raw Supabase Auth error messages (always English, regardless of the
 * app's locale) to translated copy. Without this, DE/UK-only users saw
 * untranslated strings like "Invalid login credentials" or "Email not
 * confirmed" straight from the Supabase client.
 */
export function mapAuthErrorMessage(t: (key: string) => string, rawMessage: string | null | undefined): string {
  const msg = (rawMessage || '').toLowerCase()

  if (msg.includes('invalid login credentials')) return t('invalidCredentials')
  if (msg.includes('email not confirmed')) return t('emailNotConfirmed')
  if (msg.includes('already registered') || msg.includes('user already exists')) return t('userAlreadyRegistered')
  if (msg.includes('password should be at least') || msg.includes('password should contain')) {
    return t('passwordMinLength')
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) return t('tooManyRequests')
  if (msg.includes('should be different') || msg.includes('same password')) return t('samePasswordError')

  return t('genericAuthError')
}
