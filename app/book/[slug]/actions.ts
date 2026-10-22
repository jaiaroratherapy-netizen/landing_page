'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getViewer, logActivity } from '@/lib/auth'
import { db } from '@/lib/supabase'
import { emailBooking, scheduleAssignmentEmails } from '@/lib/notify'
import { bookingProblem, isFree, KINDS, type Kind } from '@/lib/booking'
import { syncSessionEvent } from '@/lib/google'
import { fmtDateTime } from '@/lib/format'
import type { Session, Trainee } from '@/lib/types'

export async function bookSlot(_: { error?: string } | null, fd: FormData): Promise<{ error?: string } | null> {
  const viewer = await getViewer()
  if (viewer?.role !== 'client' || !viewer.client) return { error: 'Please sign in as a client to book.' }
  const client = viewer.client
  const start = String(fd.get('start') || '')
  const rescheduleId = String(fd.get('reschedule') || '') || null
  if (Number.isNaN(Date.parse(start))) return { error: 'Pick a time first.' }

  const { data: t } = await db().from('trainees').select('*').eq('slug', String(fd.get('slug'))).maybeSingle<Trainee>()
  if (!t) return { error: 'Therapist not found.' }

  let kind: Kind = fd.get('kind') === 'session' ? 'session' : 'intro'
  let existing: Session | null = null
  if (rescheduleId) {
    const { data } = await db().from('sessions').select('*').eq('id', rescheduleId).maybeSingle<Session>()
    if (!data || data.client_id !== client.id || data.trainee_id !== t.id || data.status !== 'scheduled') return { error: 'This booking can no longer be changed.' }
    existing = data
    kind = data.kind
  } else {
    const problem = await bookingProblem(client.id, client.trainee_id, t, kind)
    if (problem) return { error: problem }
  }

  if (!(await isFree(t, kind, start, existing?.id))) return { error: 'Sorry, that time was just taken. Please pick another.' }

  let sessionId = existing?.id
  if (existing) {
    await db().from('sessions').update({ scheduled_at: start, reschedule_count: existing.reschedule_count + 1, updated_at: new Date().toISOString() }).eq('id', existing.id)
    await logActivity(viewer.email, `rescheduled their ${KINDS[kind].label.toLowerCase()}`, 'session', existing.id, `to ${fmtDateTime(start)}`)
  } else {
    if (!client.trainee_id) {
      // booking an intro call is how an unmatched client chooses a therapist; the admin can still reassign
      await db().from('clients').update({ trainee_id: t.id, assigned_at: new Date().toISOString(), status: 'assigned' }).eq('id', client.id)
      await logActivity(viewer.email, 'chose a therapist by booking an intro call', 'client', client.id, `${client.full_name} → ${t.full_name}`)
      await scheduleAssignmentEmails(client.id, { clientChose: true })
    }
    const { data, error } = await db().from('sessions').insert({
      client_id: client.id, trainee_id: t.id, scheduled_at: start, duration_min: KINDS[kind].minutes, kind, created_by: 'client',
    }).select('id').single()
    if (error) return { error: error.code === '23505' ? 'Sorry, that time was just taken. Please pick another.' : 'Could not book. Please try again.' }
    sessionId = data.id
    await logActivity(viewer.email, `booked a ${KINDS[kind].label.toLowerCase()}`, 'session', data.id, `${client.full_name} with ${t.full_name} on ${fmtDateTime(start)}`)
  }
  await syncSessionEvent(sessionId!)
  await emailBooking(sessionId!, existing ? 'rescheduled' : 'booked')
  revalidatePath('/client', 'layout')
  revalidatePath('/trainee', 'layout')
  revalidatePath('/admin', 'layout')
  redirect(`/client?booked=${kind}`)
}
