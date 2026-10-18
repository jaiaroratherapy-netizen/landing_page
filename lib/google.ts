import 'server-only'
import { db } from './supabase'
import { KINDS } from './kinds'
import type { Session } from './types'

// Trainees connect their own Google Calendar (separately from sign-in) so bookings land there with a Meet link,
// clients get Google's invite email, and busy times in that calendar are hidden from the booking page.

export const GOOGLE_SCOPES = [
  'openid', 'email',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.freebusy',
]

export function googleConfigured() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

export function authUrl(state: string, redirectUri: string, loginHint?: string) {
  const q = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!, redirect_uri: redirectUri, response_type: 'code', scope: GOOGLE_SCOPES.join(' '),
    access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true', state,
  })
  if (loginHint) q.set('login_hint', loginHint)
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`
}

async function token(body: Record<string, string>) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, ...body }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || data.error || `token ${res.status}`)
  return data as { access_token: string; expires_in: number; refresh_token?: string; scope?: string; id_token?: string }
}

export async function exchangeCode(code: string, redirectUri: string) {
  const t = await token({ code, redirect_uri: redirectUri, grant_type: 'authorization_code' })
  // the id_token came straight from Google over TLS, so reading its payload is enough here
  const email = t.id_token ? JSON.parse(Buffer.from(t.id_token.split('.')[1], 'base64url').toString()).email as string : null
  return { refreshToken: t.refresh_token, scope: t.scope ?? '', email }
}

const cache = new Map<string, { token: string; until: number }>()

async function accessToken(traineeId: string) {
  const hit = cache.get(traineeId)
  if (hit && hit.until > Date.now() + 60_000) return hit.token
  const { data: acct } = await db().from('google_accounts').select('refresh_token').eq('trainee_id', traineeId).maybeSingle()
  if (!acct || !googleConfigured()) return null
  try {
    const t = await token({ refresh_token: acct.refresh_token, grant_type: 'refresh_token' })
    cache.set(traineeId, { token: t.access_token, until: Date.now() + t.expires_in * 1000 })
    return t.access_token
  } catch (e) {
    await db().from('google_accounts').update({ last_error: `Calendar access stopped working: ${(e as Error).message}. Please reconnect.` }).eq('trainee_id', traineeId)
    return null
  }
}

async function api(traineeId: string, path: string, init: RequestInit = {}) {
  const at = await accessToken(traineeId)
  if (!at) return null
  const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init, headers: { Authorization: `Bearer ${at}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })
  if (res.status === 404 || res.status === 410) return { gone: true }
  const data = res.status === 204 ? {} : await res.json()
  if (!res.ok) throw new Error(data.error?.message || `Google Calendar ${res.status}`)
  return data
}

/** Busy intervals from the trainee's primary Google Calendar (empty when not connected). */
export async function busyTimes(traineeId: string, from: Date, to: Date): Promise<{ start: string; end: string }[]> {
  const data = await api(traineeId, '/freeBusy', {
    method: 'POST', body: JSON.stringify({ timeMin: from.toISOString(), timeMax: to.toISOString(), items: [{ id: 'primary' }] }),
  })
  return data?.calendars?.primary?.busy ?? []
}

/** Creates or updates the Google Calendar event for a session. Never throws: booking must not fail because of Google. */
export async function syncSessionEvent(sessionId: string) {
  const { data: s } = await db().from('sessions').select('*').eq('id', sessionId).maybeSingle<Session>()
  if (!s) return
  try {
    if (s.status === 'cancelled') {
      if (s.google_event_id) await api(s.trainee_id, `/calendars/primary/events/${s.google_event_id}?sendUpdates=all`, { method: 'DELETE' })
      return
    }
    const { data: client } = await db().from('clients').select('full_name, email').eq('id', s.client_id).single()
    const first = client?.full_name.split(' ')[0] ?? 'client'
    const label = s.kind === 'intro' ? `Free intro call with ${first}` : `Therapy session with ${first}`
    const start = new Date(s.scheduled_at)
    const event = {
      summary: `Kirana · ${label}`,
      description: `${KINDS[s.kind].label} booked through Kirana Counselling.\nManage it at https://kiranacounselling.com/login`,
      start: { dateTime: start.toISOString(), timeZone: 'Asia/Kolkata' },
      end: { dateTime: new Date(start.getTime() + s.duration_min * 60_000).toISOString(), timeZone: 'Asia/Kolkata' },
      attendees: client?.email ? [{ email: client.email, displayName: client.full_name }] : [],
      guestsCanModify: false,
      reminders: { useDefault: true },
      ...(s.meeting_link ? { location: s.meeting_link } : { conferenceData: { createRequest: { requestId: s.id, conferenceSolutionKey: { type: 'hangoutsMeet' } } } }),
    }
    const res = s.google_event_id
      ? await api(s.trainee_id, `/calendars/primary/events/${s.google_event_id}?sendUpdates=all&conferenceDataVersion=1`, { method: 'PATCH', body: JSON.stringify(event) })
      : await api(s.trainee_id, `/calendars/primary/events?sendUpdates=all&conferenceDataVersion=1`, { method: 'POST', body: JSON.stringify(event) })
    if (!res || 'gone' in res) return
    const patch: Partial<Session> = {}
    if (res.id && res.id !== s.google_event_id) patch.google_event_id = res.id
    if (!s.meeting_link && res.hangoutLink) patch.meeting_link = res.hangoutLink
    if (Object.keys(patch).length) await db().from('sessions').update(patch).eq('id', s.id)
    await db().from('google_accounts').update({ last_error: null }).eq('trainee_id', s.trainee_id)
  } catch (e) {
    await db().from('google_accounts').update({ last_error: `Could not update a calendar event: ${(e as Error).message}` }).eq('trainee_id', s.trainee_id)
  }
}
