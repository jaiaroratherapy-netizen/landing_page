'use server'

import { redirect } from 'next/navigation'
import { authClient, db } from '@/lib/supabase'
import { adminEmails } from '@/lib/auth'
import { origin } from '@/lib/site'

function safeNext(next: FormDataEntryValue | null) {
  const n = String(next || '')
  return n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard'
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeNext(formData.get('next'))
  const supabase = await authClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}` },
  })
  if (error || !data.url) redirect('/login?error=google')
  redirect(data.url)
}

export type EmailState = { ok?: boolean; error?: string }

export async function signInWithEmail(_: EmailState, formData: FormData): Promise<EmailState> {
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const next = safeNext(formData.get('next'))
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Please enter a valid email.' }

  // only people Kirana has registered get a link
  const known = adminEmails().includes(email) || (await Promise.all([
    db().from('trainees').select('id', { head: true, count: 'exact' }).eq('email', email),
    db().from('clients').select('id', { head: true, count: 'exact' }).eq('email', email),
  ])).some((r) => (r.count ?? 0) > 0)
  if (!known) return { error: 'This email is not registered with Kirana yet. Use the email you signed up with.' }

  const supabase = await authClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}` },
  })
  if (error) return { error: error.status === 429 ? 'Too many links sent. Please wait a few minutes and try again.' : 'Could not send the link. Please try again.' }
  return { ok: true }
}
