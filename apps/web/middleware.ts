import createMiddleware from 'next-intl/middleware'
import { locales } from './i18n'

export default createMiddleware({
  locales,
  defaultLocale: 'de',
  localePrefix: 'always',
})

export const config = {
  // Optimized matcher - exclude static files and API routes
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}

