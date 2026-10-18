'use server'

import { revalidatePath } from 'next/cache'
import { getViewer, logActivity } from '@/lib/auth'
import { db } from '@/lib/supabase'

/** A client without a therapist asks for this one; the admin sees it on the client and in activity. */
export async function requestTherapist(fd: FormData) {
  const viewer = await getViewer()
  if (viewer?.role !== 'client' || !viewer.client) return { error: 'Please sign in as a client first.' }
  if (viewer.client.trainee_id) return { error: 'You already have a therapist. Message us on WhatsApp if you would like to change.' }
  const { data: t } = await db().from('trainees').select('id, full_name').eq('id', String(fd.get('trainee_id'))).eq('is_public', true).maybeSingle()
  if (!t) return { error: 'Therapist not found.' }
  await db().from('clients').update({ pref: `Requested ${t.full_name} from their profile`, updated_at: new Date().toISOString() }).eq('id', viewer.client.id)
  await logActivity(viewer.email, 'asked to work with a therapist', 'client', viewer.client.id, `${viewer.client.full_name} → ${t.full_name}`)
  revalidatePath('/admin', 'layout')
  return { ok: `Thanks! We’ve noted that you’d like to work with ${t.full_name.split(' ')[0]}. We’ll confirm on WhatsApp.` }
}
