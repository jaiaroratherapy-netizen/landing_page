import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { AppShell } from '@/components/AppShell'

export const metadata: Metadata = { title: 'My therapy', robots: { index: false } }

const NAV = [
  { href: '/client', label: 'My sessions', icon: '◷' },
  { href: '/client/profile', label: 'Profile', icon: '☺' },
  { href: '/therapists', label: 'Therapists', icon: '✦' },
]

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const me = await requireRole('client')
  return <AppShell title="My therapy" user={{ name: me.client.full_name, email: me.email, photo: me.avatar, profileHref: '/client/profile' }} nav={NAV}>{children}</AppShell>
}
