'use server'

import { db } from '@/lib/supabase'
import { emailConsentSigned } from '@/lib/notify'
import { logActivity } from '@/lib/auth'
import { parseConsent } from '@/lib/consent'
import type { Client, Invite } from '@/lib/types'

// Clients sign through their unique link; the unguessable token is the authorisation.
export async function signClientConsent(token: string, fd: FormData) {
  const { data: invite } = await db().from('invites').select('*').eq('token', token).eq('kind', 'client_consent').maybeSingle<Invite>()
  if (!invite || invite.used_at || new Date(invite.expires_at) < new Date()) return { error: 'This link is no longer valid. Ask your therapist for a new one.' }
  const { data: client } = await db().from('clients').select('*').eq('id', invite.client_id!).maybeSingle<Client>()
  if (!client) return { error: 'This link is no longer valid.' }

  const parsed = await parseConsent(fd, 'client')
  if ('error' in parsed) return { error: parsed.error }

  const { error } = await db().from('consents').insert({
    kind: 'client', client_id: client.id, trainee_id: invite.trainee_id, invite_token: token, ...parsed.value,
  })
  if (error) return { error: 'Could not save your form. Please try again.' }
  await Promise.all([
    db().from('invites').update({ used_at: new Date().toISOString() }).eq('token', token),
    db().from('clients').update({ emergency_contact: parsed.value.emergency_contact, updated_at: new Date().toISOString() }).eq('id', client.id),
  ])
  await logActivity(client.email, 'signed the client consent form', 'client', client.id, client.full_name)
  await emailConsentSigned(client.id)
  return { ok: 'Thank you! Your consent form is saved. You can now sign in to see your sessions.' }
}
