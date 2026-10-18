'use server'

import { revalidatePath } from 'next/cache'
import { logActivity, requireRole } from '@/lib/auth'
import { db } from '@/lib/supabase'
import { bool, int, newToken, text } from '@/lib/consent'
import { TRAINEE_FEEDBACK } from '@/lib/forms'
import { parsePublicProfile } from '@/lib/profile-form'
import { removePhoto, savePhoto } from '@/lib/photos'
import type { Client } from '@/lib/types'

type Result = { ok?: string; error?: string }

async function ownClient(clientId: string) {
  const me = await requireRole('trainee')
  const { data: client } = await db().from('clients').select('*').eq('id', clientId).maybeSingle<Client>()
  if (!client || client.trainee_id !== me.trainee.id) return { me, client: null }
  return { me, client }
}

function refreshProfile(slug: string | null) {
  revalidatePath('/trainee', 'layout')
  revalidatePath('/admin', 'layout')
  revalidatePath('/therapists')
  if (slug) revalidatePath(`/therapists/${slug}`)
}

/** Private details only Kirana sees. */
export async function updateMyProfile(fd: FormData): Promise<Result> {
  const me = await requireRole('trainee')
  await db().from('trainees').update({
    full_name: text(fd, 'full_name', 200) ?? me.trainee.full_name, phone: text(fd, 'phone', 30),
    upi_id: text(fd, 'upi_id', 120), emergency_contact: text(fd, 'emergency_contact', 300),
    updated_at: new Date().toISOString(),
  }).eq('id', me.trainee.id)
  refreshProfile(me.trainee.slug)
  return { ok: 'Saved.' }
}

/** What clients and visitors see on /therapists. */
export async function updateMyPublicProfile(fd: FormData): Promise<Result> {
  const me = await requireRole('trainee')
  const parsed = parsePublicProfile(fd)
  if ('error' in parsed) return { error: parsed.error }
  await db().from('trainees').update({ ...parsed.patch, updated_at: new Date().toISOString() }).eq('id', me.trainee.id)
  await logActivity(me.email, 'updated their public profile', 'trainee', me.trainee.id, me.trainee.full_name)
  refreshProfile(me.trainee.slug)
  return { ok: 'Public profile saved.' }
}

export async function uploadMyPhoto(fd: FormData): Promise<Result> {
  const me = await requireRole('trainee')
  const file = fd.get('photo')
  if (!(file instanceof Blob) || !file.size) return { error: 'Choose a photo first.' }
  try {
    const url = await savePhoto(me.trainee.id, file, 'image/jpeg')
    await db().from('trainees').update({ photo_url: url, updated_at: new Date().toISOString() }).eq('id', me.trainee.id)
    await removePhoto(me.trainee.photo_url)
  } catch (e) { return { error: (e as Error).message } }
  refreshProfile(me.trainee.slug)
  return { ok: 'Photo updated.' }
}

export async function createConsentLink(fd: FormData): Promise<Result> {
  const { me, client } = await ownClient(String(fd.get('client_id')))
  if (!client) return { error: 'This client is not assigned to you.' }
  // only one live link per client
  await db().from('invites').update({ expires_at: new Date().toISOString() }).eq('client_id', client.id).eq('kind', 'client_consent').is('used_at', null)
  await db().from('invites').insert({ token: newToken(), kind: 'client_consent', client_id: client.id, trainee_id: me.trainee.id, created_by: me.email })
  await logActivity(me.email, 'created a consent link', 'client', client.id, client.full_name)
  revalidatePath(`/trainee/clients/${client.id}`)
  return { ok: 'Consent link ready. Copy it or send it on WhatsApp.' }
}

export async function saveTracking(fd: FormData): Promise<Result> {
  const { me, client } = await ownClient(String(fd.get('client_id')))
  if (!client) return { error: 'This client is not assigned to you.' }
  const row = {
    client_id: client.id, trainee_id: me.trainee.id,
    intro_call: bool(fd, 'intro_call'), first_session: bool(fd, 'first_session'),
    first_session_feedback: text(fd, 'first_session_feedback'), sessions_taken: int(fd, 'sessions_taken'),
    dropped_out: bool(fd, 'dropped_out'), dropout_reason: text(fd, 'dropout_reason'), dropout_after: int(fd, 'dropout_after'),
    overall_feedback: text(fd, 'overall_feedback'), private_practice: bool(fd, 'private_practice'), private_price: int(fd, 'private_price'),
    updated_at: new Date().toISOString(),
  }
  const { error } = await db().from('client_tracking').upsert(row)
  if (error) return { error: 'Could not save.' }
  if (row.dropped_out && client.status !== 'dropped') await db().from('clients').update({ status: 'dropped' }).eq('id', client.id)
  await logActivity(me.email, 'updated client tracking', 'client', client.id, client.full_name)
  revalidatePath('/trainee', 'layout')
  revalidatePath('/admin', 'layout')
  return { ok: 'Saved.' }
}

export async function submitTraineeFeedback(fd: FormData): Promise<Result> {
  const me = await requireRole('trainee')
  const answers = Object.fromEntries(TRAINEE_FEEDBACK.map((q) => [q.key, text(fd, q.key) ?? '']).filter(([, v]) => v))
  if (!Object.keys(answers).length) return { error: 'Please answer at least one question.' }
  const sessionId = text(fd, 'session_id')
  if (sessionId) {
    const { data: s } = await db().from('sessions').select('trainee_id').eq('id', sessionId).maybeSingle()
    if (s?.trainee_id !== me.trainee.id) return { error: 'Session not found.' }
  }
  await db().from('trainee_feedback').insert({ trainee_id: me.trainee.id, session_id: sessionId, answers })
  await logActivity(me.email, 'submitted trainee feedback', 'trainee', me.trainee.id)
  revalidatePath('/trainee/feedback')
  revalidatePath('/admin', 'layout')
  return { ok: 'Thank you! Your feedback went to the Kirana team only.' }
}
