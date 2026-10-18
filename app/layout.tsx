import type { Metadata, Viewport } from 'next'
import { Eczar, Karla } from 'next/font/google'
import './globals.css'

const eczar = Eczar({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-display' })
const karla = Karla({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-body' })

export const metadata: Metadata = {
  metadataBase: new URL('https://kiranacounselling.com'),
  title: { default: 'Kirana Counselling', template: '%s · Kirana Counselling' },
  description: 'Kirana Counselling: therapist training and affordable therapy.',
  icons: { icon: [{ url: '/favicon.ico', sizes: '32x32' }, { url: '/icons/favicon.svg', type: 'image/svg+xml' }], apple: '/icons/apple-touch-icon.png' },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = { themeColor: '#EED9AE', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${eczar.variable} ${karla.variable}`}>
      <body>{children}</body>
    </html>
  )
}
