import Link from 'next/link'

/**
 * Renders inside the root app/layout.tsx (which already provides <html>/<body>),
 * so this must NOT add its own — that caused a hydration mismatch. Kept locale-
 * neutral since this is the top-level fallback outside app/[locale]/not-found.tsx.
 */
export default function GlobalNotFound() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '2rem', margin: 0 }}>404 – Seite nicht gefunden</h1>
      <p style={{ color: '#666', margin: 0 }}>Diese Seite existiert nicht oder wurde verschoben.</p>
      <Link href="/de" style={{ color: '#a05a5a', textDecoration: 'underline' }}>
        Zur Startseite
      </Link>
    </div>
  )
}
