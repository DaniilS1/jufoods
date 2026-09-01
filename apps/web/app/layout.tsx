import type { Metadata } from 'next'
import { Inter, Lora } from 'next/font/google'
import './globals.css'
import { SITE_URL } from '@/lib/site-config'

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-sans' })
const lora = Lora({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-display',
  weight: ['400', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Jufoods - Torten & Desserts',
  description: 'Handgemachte Torten und Desserts',
  openGraph: {
    siteName: 'Jufoods',
    images: [{ url: '/cakes.jpeg', width: 1254, height: 1254 }],
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning className="theme-neutral">
      <body className={`${inter.variable} ${lora.variable} ${inter.className}`}>{children}</body>
    </html>
  )
}
