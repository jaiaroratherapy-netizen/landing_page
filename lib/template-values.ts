import 'server-only'
import { db } from './supabase'
import { fmtDateTime } from './format'
import { TEMPLATES, type Audience, type Template } from './templates'
import type { Client, Session, Trainee } from './types'

const SITE = (process.env.PUBLIC_SITE_URL || 'https://kiranacounselling.com').replace(/\/$/, '')
const first = (n: string | null | undefined) => (n ?? '').trim().split(/\s+/)[0] || ''

/** Templates with any admin edits applied. */
export async function templatesFor(from: 'trainee' | 'admin', audience?: Audience): Promise<Template[]> {
  const { data } = await db().from('message_templates').select('key, body')
  const custom = new Map((data ?? []).map((r) => [r.key as string, r.body as string]))
  return TEMPLATES.filter((t) => t.from === from && (!audience || t.audience === audience)).map((t) => ({ ...t, body: custom.get(t.key) ?? t.body }))
}

export async function clientValues(c: Client) {
  const [{ data: t }, { data: sessions }, { data: invite }] = await Promise.all([
    c.trainee_id ? db().from('trainees').select('*').eq('id', c.trainee_id).maybeSingle<Trainee>() : Promise.resolve({ data: null }),
    db().from('sessions').select('*').eq('client_id', c.id).order('scheduled_at'),
    db().from('invites').select('token').eq('client_id', c.id).eq('kind', 'client_consent').is('used_at', null)
      .gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])
  const all = (sessions ?? []) as Session[]
  const next = all.find((s) => s.status === 'scheduled' && new Date(s.scheduled_at).getTime() > Date.now())
  const done = all.filter((s) => s.status === 'completed' && s.kind !== 'intro')
  const lastDone = [...all].reverse().find((s) => s.status === 'completed')
  return {
    client_first: first(c.full_name), client_name: c.full_name,
    therapist_first: first(t?.full_name), therapist_name: t?.full_name,
    intro_link: t?.slug ? `${SITE}/book/${t.slug}?type=intro` : null,
    session_link: t?.slug ? `${SITE}/book/${t.slug}?type=session` : null,
    consent_link: invite ? `${SITE}/consent/${invite.token}` : null,
    next_session: next ? fmtDateTime(next.scheduled_at) : null,
    next_number: next && next.kind !== 'intro' ? String(done.length + 1) : null,
    meeting_link: next?.meeting_link ?? null,
    upi_id: t?.upi_id ?? null,
    feedback_link: lastDone ? `${SITE}/client/feedback/${lastDone.id}` : `${SITE}/client`,
    therapists_link: `${SITE}/therapists`,
  }
}

export async function traineeValues(t: Trainee) {
  const [{ data: invite }, { data: latest }] = await Promise.all([
    db().from('invites').select('token').eq('trainee_id', t.id).eq('kind', 'trainee_onboarding').is('used_at', null)
      .gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    db().from('clients').select('id, full_name').eq('trainee_id', t.id).order('assigned_at', { ascending: false }).limit(1).maybeSingle(),
  ])
  return {
    trainee_first: first(t.full_name), trainee_email: t.email,
    onboarding_link: invite ? `${SITE}/join/${invite.token}` : null,
    profile_link: `${SITE}/trainee/profile`,
    client_first: first(latest?.full_name), client_page_link: latest ? `${SITE}/trainee/clients/${latest.id}` : null,
    sessions_link: `${SITE}/trainee/sessions`,
  }
}
