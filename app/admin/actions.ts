'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity, requireRole } from '@/lib/auth'
import { db } from '@/lib/supabase'
import { emailTraineeInvite, scheduleAssignmentEmails } from '@/lib/notify'
import { emailConfigured } from '@/lib/email'
import { TEMPLATES } from '@/lib/templates'
import { int, newToken, text } from '@/lib/consent'
import { parsePublicProfile, parseSlug } from '@/lib/profile-form'
import { removePhoto, savePhoto } from '@/lib/photos'
import type { Client, Trainee } from '@/lib/types'

type Result = { ok?: string; error?: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function refresh() {
  revalidatePath('/therapists', 'layout')
  revalidatePath('/admin', 'layout')
  revalidatePath('/trainee', 'layout')
  revalidatePath('/client', 'layout')
}

// ---------- cohorts ----------

export async function saveCohort(fd: FormData): Promise<Result> {
  const admin = await requireRole('admin')
  const id = text(fd, 'id')
  const row = { name: text(fd, 'name', 120), starts_on: text(fd, 'starts_on'), ends_on: text(fd, 'ends_on'), notes: text(fd, 'notes') }
  if (!row.name) return { error: 'Give the cohort a name.' }
  const { error } = id ? await db().from('cohorts').update(row).eq('id', id) : await db().from('cohorts').insert(row)
  if (error) return { error: 'Could not save the cohort.' }
  await logActivity(admin.email, id ? 'updated a cohort' : 'created a cohort', 'cohort', id ?? undefined, row.name)
  refresh()
  return { ok: id ? 'Cohort saved.' : 'Cohort created.' }
}

export async function deleteCohort(fd: FormData): Promise<Result> {
  await requireRole('admin')
  await db().from('cohorts').delete().eq('id', String(fd.get('id')))
  refresh()
  return { ok: 'Cohort deleted. Its trainees are now unassigned.' }
}

// ---------- trainees ----------

async function freeSlug(name: string) {
  const base = parseSlug(new FormData(), name) || 'therapist'
  for (let n = 1; ; n++) {
    const slug = n === 1 ? base : `${base}-${n}`
    const { count } = await db().from('trainees').select('id', { head: true, count: 'exact' }).eq('slug', slug)
    if (!count) return slug
  }
}

async function createInvite(kind: 'trainee_onboarding' | 'client_consent', ids: { trainee_id?: string; client_id?: string }, by: string) {
  const token = newToken()
  await db().from('invites').insert({ token, kind, ...ids, created_by: by })
  return token
}

export async function inviteTrainee(fd: FormData): Promise<Result> {
  const admin = await requireRole('admin')
  const email = (text(fd, 'email', 200) || '').toLowerCase()
  const full_name = text(fd, 'full_name', 200)
  if (!EMAIL.test(email)) return { error: 'Enter the trainee’s Google account email.' }
  if (!full_name) return { error: 'Enter the trainee’s name.' }
  const { data: clash } = await db().from('clients').select('id').eq('email', email).maybeSingle()
  if (clash) return { error: 'This email already belongs to a client.' }

  const { data: t, error } = await db().from('trainees').insert({
    email, full_name, phone: text(fd, 'phone', 30), cohort_id: text(fd, 'cohort_id'), slug: await freeSlug(full_name),
  }).select('id').single()
  if (error) return { error: error.code === '23505' ? 'A trainee with this email already exists.' : 'Could not add the trainee.' }
  await createInvite('trainee_onboarding', { trainee_id: t.id }, admin.email)
  await emailTraineeInvite(t.id)
  await logActivity(admin.email, 'invited a trainee', 'trainee', t.id, full_name)
  refresh()
  redirect(`/admin/trainees/${t.id}?invited=1`)
}

export async function newTraineeLink(fd: FormData): Promise<Result> {
  const admin = await requireRole('admin')
  const id = String(fd.get('trainee_id'))
  await db().from('invites').update({ expires_at: new Date().toISOString() }).eq('trainee_id', id).eq('kind', 'trainee_onboarding').is('used_at', null)
  await createInvite('trainee_onboarding', { trainee_id: id }, admin.email)
  refresh()
  return { ok: 'New onboarding link created. The old one no longer works.' }
}

async function activeInvite(traineeId: string, by: string) {
  const { data } = await db().from('invites').select('token').eq('trainee_id', traineeId).eq('kind', 'trainee_onboarding')
    .is('used_at', null).gt('expires_at', new Date().toISOString()).limit(1).maybeSingle()
  if (!data) await createInvite('trainee_onboarding', { trainee_id: traineeId }, by)
}

export async function emailOnboardingLink(fd: FormData): Promise<Result> {
  const admin = await requireRole('admin')
  if (!emailConfigured()) return { error: 'Email isn’t set up yet (add GMAIL_USER and GMAIL_APP_PASSWORD).' }
  const id = String(fd.get('trainee_id'))
  await activeInvite(id, admin.email)
  if (!(await emailTraineeInvite(id))) return { error: 'Could not prepare the email.' }
  await logActivity(admin.email, 'emailed an onboarding link', 'trainee', id)
  refresh()
  return { ok: 'Onboarding email sent.' }
}

/** Emails the onboarding link to every trainee who hasn't signed their form yet. */
export async function emailAllPendingOnboarding(): Promise<Result> {
  const admin = await requireRole('admin')
  if (!emailConfigured()) return { error: 'Email isn’t set up yet (add GMAIL_USER and GMAIL_APP_PASSWORD).' }
  const { data: pending } = await db().from('trainees').select('id').eq('status', 'invited')
  for (const t of pending ?? []) { await activeInvite(t.id, admin.email); await emailTraineeInvite(t.id) }
  await logActivity(admin.email, 'emailed onboarding links', 'trainee', undefined, `${pending?.length ?? 0} trainees`)
  refresh()
  return { ok: `Queued ${pending?.length ?? 0} onboarding emails. They go out over the next few minutes.` }
}

export async function updateTrainee(fd: FormData): Promise<Result> {
  const admin = await requireRole('admin')
  const id = String(fd.get('id'))
  const email = (text(fd, 'email', 200) || '').toLowerCase()
  if (!EMAIL.test(email)) return { error: 'Enter a valid email.' }
  const patch: Partial<Trainee> = {
    email, full_name: text(fd, 'full_name', 200) || undefined, phone: text(fd, 'phone', 30),
    cohort_id: text(fd, 'cohort_id'), status: (text(fd, 'status') as Trainee['status']) || 'invited',
    upi_id: text(fd, 'upi_id', 120),
    admin_notes: text(fd, 'admin_notes'), updated_at: new Date().toISOString(),
  }
  const { error } = await db().from('trainees').update(patch).eq('id', id)
  if (error) return { error: error.code === '23505' ? 'Another trainee already uses this email.' : 'Could not save.' }
  await logActivity(admin.email, 'edited a trainee profile', 'trainee', id, patch.full_name)
  refresh()
  return { ok: 'Profile saved.' }
}

export async function updateTraineePublic(fd: FormData): Promise<Result> {
  const admin = await requireRole('admin')
  const id = String(fd.get('id'))
  const { data: t } = await db().from('trainees').select('full_name').eq('id', id).single()
  if (!t) return { error: 'Trainee not found.' }
  const parsed = parsePublicProfile(fd)
  if ('error' in parsed) return { error: parsed.error }
  const slug = parseSlug(fd, t.full_name)
  if (!slug) return { error: 'Profile address can only use letters, numbers and dashes.' }
  const { error } = await db().from('trainees').update({ ...parsed.patch, slug, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return { error: error.code === '23505' ? 'Another trainee already uses this profile address.' : 'Could not save.' }
  await logActivity(admin.email, 'edited a public profile', 'trainee', id, t.full_name)
  refresh()
  return { ok: 'Public profile saved.' }
}

export async function uploadTraineePhoto(fd: FormData): Promise<Result> {
  await requireRole('admin')
  const id = String(fd.get('trainee_id'))
  const file = fd.get('photo')
  if (!(file instanceof Blob) || !file.size) return { error: 'Choose a photo first.' }
  const { data: t } = await db().from('trainees').select('photo_url').eq('id', id).single()
  try {
    const url = await savePhoto(id, file, 'image/jpeg')
    await db().from('trainees').update({ photo_url: url }).eq('id', id)
    await removePhoto(t?.photo_url ?? null)
  } catch (e) { return { error: (e as Error).message } }
  refresh()
  return { ok: 'Photo updated.' }
}

export async function deleteTrainee(fd: FormData): Promise<Result> {
  const admin = await requireRole('admin')
  const id = String(fd.get('id'))
  const { count } = await db().from('sessions').select('id', { head: true, count: 'exact' }).eq('trainee_id', id)
  if (count) return { error: 'This trainee has sessions on record. Set their status to “completed” or “paused” instead.' }
  const { data: moved } = await db().from('clients').update({ trainee_id: null, status: 'unassigned' }).eq('trainee_id', id).select('id')
  for (const c of moved ?? []) await scheduleAssignmentEmails(c.id)
  await db().from('trainees').delete().eq('id', id)
  await logActivity(admin.email, 'removed a trainee', 'trainee', id)
  refresh()
  redirect('/admin/trainees')
}

// ---------- clients ----------

export async function assignClient(fd: FormData): Promise<Result> {
  const admin = await requireRole('admin')
  const clientId = String(fd.get('client_id'))
  const traineeId = text(fd, 'trainee_id')
  const { data: client } = await db().from('clients').select('*').eq('id', clientId).maybeSingle<Client>()
  if (!client) return { error: 'Client not found.' }
  if (traineeId === client.trainee_id) return { ok: 'No change.' }
  const patch = traineeId
    ? { trainee_id: traineeId, assigned_at: new Date().toISOString(), status: client.status === 'unassigned' ? 'assigned' : client.status }
    : { trainee_id: null, assigned_at: null, status: 'unassigned' }
  await db().from('clients').update(patch).eq('id', clientId)
  // future sessions follow the client to the new therapist
  if (traineeId) await db().from('sessions').update({ trainee_id: traineeId }).eq('client_id', clientId).eq('status', 'scheduled')
  let name: string | undefined
  if (traineeId) name = (await db().from('trainees').select('full_name').eq('id', traineeId).single()).data?.full_name
  await logActivity(admin.email, traineeId ? 'assigned a client' : 'unassigned a client', 'client', clientId, `${client.full_name}${name ? ' → ' + name : ''}`)
  refresh()
  await scheduleAssignmentEmails(clientId)
  return { ok: traineeId ? `Assigned to ${name}. Both will be emailed in 5 minutes unless you change it.` : 'Unassigned.' }
}

export async function updateClient(fd: FormData): Promise<Result> {
  const admin = await requireRole('admin')
  const id = String(fd.get('id'))
  const email = (text(fd, 'email', 200) || '').toLowerCase()
  if (!EMAIL.test(email)) return { error: 'Enter a valid email.' }
  const { error } = await db().from('clients').update({
    email, whatsapp: text(fd, 'whatsapp', 20), status: text(fd, 'status') || 'unassigned', pronouns: text(fd, 'pronouns', 60),
    admin_notes: text(fd, 'admin_notes'), updated_at: new Date().toISOString(),
  }).eq('id', id)
  if (error) return { error: error.code === '23505' ? 'Another client already uses this email.' : 'Could not save.' }
  await logActivity(admin.email, 'edited a client', 'client', id)
  refresh()
  return { ok: 'Saved.' }
}

// ---------- WhatsApp templates ----------

export async function saveTemplate(fd: FormData): Promise<Result> {
  const admin = await requireRole('admin')
  const key = String(fd.get('key'))
  const body = String(fd.get('body') ?? '').trim()
  if (!TEMPLATES.some((t) => t.key === key)) return { error: 'Unknown template.' }
  if (body.length < 5) return { error: 'The message is empty.' }
  await db().from('message_templates').upsert({ key, body: body.slice(0, 2000), updated_by: admin.email, updated_at: new Date().toISOString() })
  revalidatePath('/admin', 'layout')
  revalidatePath('/trainee/messages')
  return { ok: 'Saved. Everyone now gets this wording.' }
}

export async function resetTemplate(fd: FormData): Promise<Result> {
  await requireRole('admin')
  await db().from('message_templates').delete().eq('key', String(fd.get('key')))
  revalidatePath('/admin', 'layout')
  revalidatePath('/trainee/messages')
  return { ok: 'Back to the default wording.' }
}
