import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { AppShell } from '@/components/AppShell'

export const metadata: Metadata = { title: 'Therapist', robots: { index: false } }

const NAV = [
  { href: '/trainee', label: 'Dashboard', icon: '◎' },
  { href: '/trainee/clients', label: 'My clients', icon: '♡' },
  { href: '/trainee/sessions', label: 'Sessions', icon: '◷' },
  { href: '/trainee/feedback', label: 'Feedback', icon: '✎' },
  { href: '/trainee/profile', label: 'Profile', icon: '☺' },
]

export default async function TraineeLayout({ children }: { children: React.ReactNode }) {
  const me = await requireRole('trainee')
  return <AppShell title="Therapist" who={me.email} nav={NAV}>{children}</AppShell>
}
