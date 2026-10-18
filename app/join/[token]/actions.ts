'use server'

import { redirect } from 'next/navigation'
import { getViewer, logActivity } from '@/lib/auth'
import { db } from '@/lib/supabase'
import { parseConsent, text } from '@/lib/consent'
import type { Invite, Trainee } from '@/lib/types'

export async function completeOnboarding(token: string, fd: FormData) {
  const viewer = await getViewer()
  const { data: invite } = await db().from('invites').select('*').eq('token', token).eq('kind', 'trainee_onboarding').maybeSingle<Invite>()
  if (!invite || invite.used_at || new Date(invite.expires_at) < new Date()) return { error: 'This link is no longer valid. Ask Kirana for a new one.' }
  const { data: trainee } = await db().from('trainees').select('*').eq('id', invite.trainee_id!).maybeSingle<Trainee>()
  if (!trainee) return { error: 'This link is no longer valid.' }
  if (!viewer || viewer.email !== trainee.email) return { error: `Please sign in with ${trainee.email} first.` }

  const parsed = await parseConsent(fd)
  if ('error' in parsed) return { error: parsed.error }

  const { error } = await db().from('consents').insert({ kind: 'trainee', trainee_id: trainee.id, invite_token: token, ...parsed.value })
  if (error) return { error: 'Could not save your form. Please try again.' }
  await Promise.all([
    db().from('invites').update({ used_at: new Date().toISOString() }).eq('token', token),
    db().from('trainees').update({
      status: trainee.status === 'invited' ? 'onboarded' : trainee.status,
      user_id: viewer.userId,
      emergency_contact: parsed.value.emergency_contact,
      phone: text(fd, 'phone', 30) ?? trainee.phone,
      updated_at: new Date().toISOString(),
    }).eq('id', trainee.id),
  ])
  await logActivity(viewer.email, 'completed trainee onboarding', 'trainee', trainee.id, trainee.full_name)
  redirect('/trainee/profile?welcome=1')
}
