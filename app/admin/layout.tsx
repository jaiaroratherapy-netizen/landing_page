import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { AppShell } from '@/components/AppShell'

export const metadata: Metadata = { title: 'Instructor', robots: { index: false } }

const NAV = [
  { href: '/admin', label: 'Overview', icon: '◎' },
  { href: '/admin/trainees', label: 'Trainees', icon: '✦' },
  { href: '/admin/cohorts', label: 'Cohorts', icon: '▦' },
  { href: '/admin/clients', label: 'Clients', icon: '♡' },
  { href: '/admin/sessions', label: 'Sessions', icon: '◷' },
  { href: '/admin/money', label: 'Money', icon: '₹' },
  { href: '/admin/feedback', label: 'Feedback', icon: '✎' },
  { href: '/admin/messages', label: 'Messages', icon: '✉' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireRole('admin')
  return <AppShell title="Instructor" user={{ name: viewer.name ?? viewer.email.split('@')[0], email: viewer.email, photo: viewer.avatar }} nav={NAV}>{children}</AppShell>
}
