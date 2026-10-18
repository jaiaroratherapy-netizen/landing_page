'use server'

import { revalidatePath } from 'next/cache'
import { getViewer, logActivity } from '@/lib/auth'
import { db } from '@/lib/supabase'
import { fmtDateTime, istInputToIso } from '@/lib/format'
import { text } from '@/lib/consent'
import { syncSessionEvent } from '@/lib/google'
import { KINDS } from '@/lib/kinds'
import type { Client, Session } from '@/lib/types'

type Result = { ok?: string; error?: string }

/** Loads a session and checks the viewer may change it. Clients can only touch their own upcoming sessions. */
async function guard(sessionId: string) {
  const viewer = await getViewer()
  if (!viewer?.role) return { error: 'Please sign in again.' } as const
  const { data: s } = await db().from('sessions').select('*').eq('id', sessionId).maybeSingle<Session>()
  if (!s) return { error: 'Session not found.' } as const
  const allowed =
    viewer.role === 'admin' ||
    (viewer.role === 'trainee' && viewer.trainee?.id === s.trainee_id) ||
    (viewer.role === 'client' && viewer.client?.id === s.client_id)
  if (!allowed) return { error: 'You cannot change this session.' } as const
  return { viewer, s } as const
}

function refresh() {
  revalidatePath('/admin', 'layout')
  revalidatePath('/trainee', 'layout')
  revalidatePath('/client', 'layout')
}

export async function bookSession(fd: FormData): Promise<Result> {
  const viewer = await getViewer()
  if (!viewer?.role) return { error: 'Please sign in again.' }
  let at: string
  try { at = istInputToIso(String(fd.get('scheduled_at') || '')) } catch { return { error: 'Pick a date and time.' } }
  if (new Date(at).getTime() < Date.now() - 6 * 3600_000 && viewer.role === 'client') return { error: 'Pick a time in the future.' }

  const clientId = viewer.role === 'client' ? viewer.client!.id : String(fd.get('client_id') || '')
  const { data: client } = await db().from('clients').select('*').eq('id', clientId).maybeSingle<Client>()
  if (!client) return { error: 'Client not found.' }
  if (!client.trainee_id) return { error: 'A therapist has not been assigned yet.' }
  if (viewer.role === 'trainee' && client.trainee_id !== viewer.trainee!.id) return { error: 'This client is not assigned to you.' }

  const kind = fd.get('kind') === 'intro' ? 'intro' : 'session'
  const duration = Math.min(180, Math.max(15, Number(fd.get('duration_min')) || KINDS[kind].minutes))
  const { data: row, error } = await db().from('sessions').insert({
    client_id: client.id, trainee_id: client.trainee_id, scheduled_at: at, duration_min: duration, kind,
    meeting_link: text(fd, 'meeting_link', 500), created_by: viewer.role,
  }).select('id').single()
  if (error) return { error: error.code === '23505' ? 'There is already a booking at that exact time.' : 'Could not book the session.' }
  await syncSessionEvent(row.id)
  if (client.status === 'assigned') await db().from('clients').update({ status: 'active' }).eq('id', client.id)
  await logActivity(viewer.email, 'booked a session', 'client', client.id, `${client.full_name} on ${fmtDateTime(at)}`)
  refresh()
  return { ok: 'Session booked.' }
}

export async function rescheduleSession(fd: FormData): Promise<Result> {
  const g = await guard(String(fd.get('id')))
  if ('error' in g) return { error: g.error }
  if (g.s.status !== 'scheduled') return { error: 'Only upcoming sessions can be rescheduled.' }
  let at: string
  try { at = istInputToIso(String(fd.get('scheduled_at') || '')) } catch { return { error: 'Pick a date and time.' } }
  const patch: Partial<Session> = { scheduled_at: at, reschedule_count: g.s.reschedule_count + 1, updated_at: new Date().toISOString() }
  if (g.viewer.role !== 'client' && fd.has('meeting_link')) patch.meeting_link = text(fd, 'meeting_link', 500)
  const { error } = await db().from('sessions').update(patch).eq('id', g.s.id)
  if (error) return { error: error.code === '23505' ? 'There is already a booking at that exact time.' : 'Could not reschedule.' }
  await syncSessionEvent(g.s.id)
  await logActivity(g.viewer.email, 'rescheduled a session', 'session', g.s.id, `to ${fmtDateTime(at)}`)
  refresh()
  return { ok: 'Rescheduled.' }
}

export async function cancelSession(fd: FormData): Promise<Result> {
  const g = await guard(String(fd.get('id')))
  if ('error' in g) return { error: g.error }
  if (g.s.status !== 'scheduled') return { error: 'This session is not upcoming.' }
  await db().from('sessions').update({
    status: 'cancelled', cancelled_by: g.viewer.role, cancel_reason: text(fd, 'reason', 500), updated_at: new Date().toISOString(),
  }).eq('id', g.s.id)
  await syncSessionEvent(g.s.id)
  await logActivity(g.viewer.email, 'cancelled a session', 'session', g.s.id, text(fd, 'reason', 200) ?? undefined)
  refresh()
  return { ok: 'Cancelled.' }
}

/** Trainee/admin only: mark as completed, no-show, or back to scheduled; save notes and payment. */
export async function updateSessionStatus(fd: FormData): Promise<Result> {
  const g = await guard(String(fd.get('id')))
  if ('error' in g) return { error: g.error }
  if (g.viewer.role === 'client') return { error: 'Only your therapist can change this.' }
  const status = String(fd.get('status') || g.s.status)
  if (!['scheduled', 'completed', 'cancelled', 'no_show'].includes(status)) return { error: 'Unknown status.' }
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (fd.has('trainee_notes')) patch.trainee_notes = text(fd, 'trainee_notes')
  if (fd.has('client_paid')) patch.client_paid = fd.get('client_paid') === 'yes'
  if (fd.has('meeting_link')) patch.meeting_link = text(fd, 'meeting_link', 500)
  await db().from('sessions').update(patch).eq('id', g.s.id)
  if ((status === 'cancelled') !== (g.s.status === 'cancelled') || patch.meeting_link !== undefined && patch.meeting_link !== g.s.meeting_link) await syncSessionEvent(g.s.id)
  if (status !== g.s.status) await logActivity(g.viewer.email, `marked a session ${status.replace('_', '-')}`, 'session', g.s.id)
  refresh()
  return { ok: 'Saved.' }
}
