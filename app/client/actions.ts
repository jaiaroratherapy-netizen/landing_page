'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity, requireRole } from '@/lib/auth'
import { db } from '@/lib/supabase'
import { text } from '@/lib/consent'
import { CLIENT_FEEDBACK } from '@/lib/forms'
import type { Session } from '@/lib/types'

export async function updateMyClientProfile(fd: FormData) {
  const me = await requireRole('client')
  const whatsapp = (text(fd, 'whatsapp', 20) || '').replace(/\D/g, '').slice(-10)
  if (whatsapp && !/^[6-9]\d{9}$/.test(whatsapp)) return { error: 'Enter a valid 10-digit WhatsApp number.' }
  await db().from('clients').update({
    whatsapp: whatsapp || null, pronouns: text(fd, 'pronouns', 60), emergency_contact: text(fd, 'emergency_contact', 300),
    updated_at: new Date().toISOString(),
  }).eq('id', me.client.id)
  revalidatePath('/client', 'layout')
  return { ok: 'Saved.' }
}

export async function submitClientFeedback(sessionId: string, fd: FormData) {
  const me = await requireRole('client')
  const { data: s } = await db().from('sessions').select('*').eq('id', sessionId).maybeSingle<Session>()
  if (!s || s.client_id !== me.client.id) return { error: 'Session not found.' }
  if (s.status !== 'completed') return { error: 'You can leave feedback once the session is completed.' }
  const answers = Object.fromEntries(CLIENT_FEEDBACK.map((q) => [q.key, text(fd, q.key) ?? '']).filter(([, v]) => v))
  if (!Object.keys(answers).length) return { error: 'Please answer at least one question.' }
  const { error } = await db().from('client_feedback').insert({ client_id: me.client.id, trainee_id: s.trainee_id, session_id: s.id, answers })
  if (error) return { error: error.code === '23505' ? 'You have already sent feedback for this session.' : 'Could not save. Please try again.' }
  await logActivity(me.email, 'left session feedback', 'session', s.id)
  revalidatePath('/client', 'layout')
  revalidatePath('/trainee', 'layout')
  revalidatePath('/admin', 'layout')
  redirect('/client?thanks=1')
}
