import 'server-only'
import { db } from './supabase'
import { box, button, layout, list, p, pHtml, queueEmail, registerJob, sendNow } from './email'
import { fmtDateTime } from './format'
import { KINDS } from './kinds'
import type { Client, Invite, Session, Trainee } from './types'

// Emails sent at each step. Links always point at the live site, even when triggered from localhost.
const SITE = (process.env.PUBLIC_SITE_URL || 'https://kiranacounselling.com').replace(/\/$/, '')
const first = (name: string | null | undefined) => (name ?? '').trim().split(/\s+/)[0] || 'there'
const ASSIGN_DELAY_MIN = 5

async function trainee(id: string | null) {
  if (!id) return null
  return (await db().from('trainees').select('*').eq('id', id).maybeSingle<Trainee>()).data
}
async function client(id: string) {
  return (await db().from('clients').select('*').eq('id', id).maybeSingle<Client>()).data
}

// ---------- trainees ----------

export async function emailTraineeInvite(traineeId: string) {
  const t = await trainee(traineeId)
  const { data: inv } = await db().from('invites').select('*').eq('trainee_id', traineeId).eq('kind', 'trainee_onboarding')
    .is('used_at', null).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(1).maybeSingle<Invite>()
  if (!t || !inv) return false
  await queueEmail({
    kind: 'trainee_invite', to: t.email, subject: 'Welcome to Kirana Counselling: complete your onboarding',
    html: layout({
      site: SITE, preheader: 'Your onboarding and consent form is ready.', heading: `Welcome, ${first(t.full_name)}!`,
      blocks: [
        p('We’re glad to have you in the Kirana Counselling pro bono training programme.'),
        p(`Please read the trainee contract and sign your consent form. Sign in with your Google account ${t.email} when asked.`),
        button(`${SITE}/join/${inv.token}`, 'Complete onboarding'),
        p('After that, set up your public profile and weekly hours so clients can book you.'),
      ],
    }),
  })
  return true
}

export async function emailTraineeOnboarded(traineeId: string) {
  const t = await trainee(traineeId)
  if (!t) return
  await queueEmail({
    kind: 'trainee_onboarded', to: t.email, subject: 'You’re in! Next steps at Kirana',
    html: layout({
      site: SITE, preheader: 'Your consent form is signed.', heading: 'You’re all set',
      blocks: [
        p(`Thank you, ${first(t.full_name)}. Your onboarding and consent form are saved.`),
        p('Three quick things so clients can find and book you:'),
        list(['Add a friendly photo and a short introduction.', 'Set your weekly availability.', 'Connect your Google Calendar so bookings appear there with a Meet link.']),
        button(`${SITE}/trainee/profile`, 'Set up my profile'),
      ],
    }),
  })
}

// ---------- clients ----------

export async function emailClientWelcome(clientId: string) {
  const c = await client(clientId)
  if (!c) return
  await queueEmail({
    kind: 'client_welcome', to: c.email, subject: 'Welcome to Kirana Counselling 💛',
    html: layout({
      site: SITE, preheader: 'What happens next, and how to book your free intro call.', heading: `Welcome, ${first(c.full_name)}`,
      blocks: [
        p('Thank you for signing up for affordable therapy with Kirana Counselling. Here is your welcome kit.'),
        box('What happens next', [
          '1. Choose a therapist you like and book a free 20-minute intro call (or we will match you within a few days).',
          '2. Your therapist sends you a consent form to read and sign.',
          '3. Start your sessions online. Sessions 1–3 are free, then ₹299 per session, paid to your therapist.',
        ]),
        button(`${SITE}/therapists`, 'Meet our therapists'),
        pHtml(`Sign in any time at <a href="${SITE}/login" style="color:#A62B4E">kiranacounselling.com/login</a> with <b>${c.email}</b> to book, reschedule or cancel sessions.`),
        box('Good to know', [
          'Sessions are 45–60 minutes, online, ideally once a week.',
          'Please tell your therapist at least 24 hours ahead if you can’t make it.',
          'Your therapist is a supervised trainee: Kirana is a training organisation.',
        ]),
        box('If you are in crisis', ['Kirana is not an emergency service. Please call:', 'Tele-MANAS: 14416 (free, 24×7)', 'Vandrevala Foundation: 1860-2662-345 (24×7)', 'iCall WhatsApp: 9152987821', 'National Emergency: 112']),
      ],
    }),
  })
}

export async function emailConsentLink(clientId: string, token: string) {
  const c = await client(clientId)
  const t = await trainee(c?.trainee_id ?? null)
  if (!c) return
  await queueEmail({
    kind: 'consent_link', to: c.email, subject: 'Please sign your consent form before your first session',
    html: layout({
      site: SITE, preheader: 'Your consent form is ready.', heading: 'Your consent form',
      blocks: [
        p(`Hi ${first(c.full_name)}, ${t ? `${t.full_name}, your therapist,` : 'your therapist'} has sent you the Kirana Counselling consent form. It explains how sessions, fees, confidentiality and recordings work, and lets you choose what you agree to.`),
        button(`${SITE}/consent/${token}`, 'Read and sign'),
        p('It takes about 10 minutes. You can say no to any optional part.'),
      ],
    }),
  })
}

export async function emailConsentSigned(clientId: string) {
  const c = await client(clientId)
  const t = await trainee(c?.trainee_id ?? null)
  if (!c || !t) return
  await queueEmail({
    kind: 'consent_signed', to: t.email, subject: `${first(c.full_name)} signed their consent form`,
    html: layout({
      site: SITE, preheader: 'You can see what they agreed to.', heading: 'Consent form signed',
      blocks: [p(`${c.full_name} has signed their consent form. Check what they said yes and no to (especially recording) before your session.`), button(`${SITE}/trainee/clients/${c.id}`, 'Open client')],
    }),
  })
}

// ---------- assignment (debounced) ----------

/** Called on every (re)assignment. Emails go out 5 minutes after the last change, so quick corrections never reach anyone. */
export async function scheduleAssignmentEmails(clientId: string, opts: { clientChose?: boolean } = {}) {
  await queueEmail({ kind: 'assignment', payload: { client_id: clientId, client_chose: !!opts.clientChose }, dedupeKey: `assign:${clientId}`, delayMinutes: ASSIGN_DELAY_MIN })
}

registerJob('assignment', async (row) => {
  const c = await client(String(row.payload?.client_id))
  if (!c) return 'skipped'
  const now = c.trainee_id, before = c.notified_trainee_id
  if (now === before) return 'skipped'
  const [tNow, tBefore] = await Promise.all([trainee(now), trainee(before)])

  if (tNow && !tBefore && row.payload?.client_chose) {
    // they picked this therapist themselves by booking an intro call; their booking email is enough
  } else if (tNow && !tBefore) {
    await sendNow(c.email, `Meet your therapist, ${first(tNow.full_name)}`, layout({
      site: SITE, preheader: 'Book your free intro call.', heading: 'Your therapist',
      blocks: [
        p(`Hi ${first(c.full_name)}, ${tNow.full_name} will be your trainee therapist at Kirana Counselling.`),
        tNow.slug ? button(`${SITE}/book/${tNow.slug}?type=intro`, 'Book a free intro call') : '',
        tNow.slug ? pHtml(`See their profile: <a href="${SITE}/therapists/${tNow.slug}" style="color:#A62B4E">kiranacounselling.com/therapists/${tNow.slug}</a>`) : '',
        p('They will also send you a consent form to sign before your first session.'),
      ],
    }))
  } else if (tNow && tBefore) {
    await sendNow(c.email, `Your therapist has changed to ${first(tNow.full_name)}`, layout({
      site: SITE, preheader: 'Here is what changes for you.', heading: 'A change of therapist',
      blocks: [
        p(`Hi ${first(c.full_name)}, your therapist is now ${tNow.full_name} (instead of ${tBefore.full_name}). This happens sometimes to find the best fit, and nothing you shared is lost.`),
        p('Any upcoming sessions you had have moved to your new therapist. Please check the times in your dashboard, or book a fresh intro call to get to know them.'),
        tNow.slug ? button(`${SITE}/book/${tNow.slug}?type=intro`, `Book an intro call with ${first(tNow.full_name)}`) : '',
        pHtml(`Questions? Just reply to this email. <a href="${SITE}/login" style="color:#A62B4E">Open my dashboard</a>`),
      ],
    }))
    await sendNow(tBefore.email, `${first(c.full_name)} has moved to another therapist`, layout({
      site: SITE, preheader: 'No action needed.', heading: 'Client reassigned',
      blocks: [p(`${c.full_name} has been reassigned to another trainee therapist by the Kirana team. You don’t need to do anything; please don’t contact them about sessions.`)],
    }))
  } else if (!tNow && tBefore) {
    await sendNow(c.email, 'We’re finding you a new therapist', layout({
      site: SITE, preheader: 'You don’t need to do anything.', heading: 'A new match is on the way',
      blocks: [p(`Hi ${first(c.full_name)}, ${tBefore.full_name} is no longer your therapist. We’ll match you with someone new very soon, or you can choose yourself and book a free intro call.`), button(`${SITE}/therapists`, 'Meet our therapists')],
    }))
    await sendNow(tBefore.email, `${first(c.full_name)} is no longer assigned to you`, layout({
      site: SITE, preheader: 'No action needed.', heading: 'Client unassigned',
      blocks: [p(`${c.full_name} is no longer assigned to you. You don’t need to do anything.`)],
    }))
  }
  if (tNow) {
    await sendNow(tNow.email, `New client: ${first(c.full_name)}`, layout({
      site: SITE, preheader: 'Please reach out within 24 hours.', heading: 'You have a new client',
      blocks: [
        p(`${c.full_name} has been assigned to you${tBefore ? ' (moved from another trainee)' : ''}.`),
        c.self_harm === 'Yes' ? box('Please note', ['At sign-up they said they have had thoughts of self-harm. Check in on safety early and talk to your supervisor if unsure.']) : '',
        list(['Reach out on WhatsApp within 24 hours (use the Messages page for ready-made texts).', 'Send them the consent form from their client page.', 'Book a free intro call.']),
        button(`${SITE}/trainee/clients/${c.id}`, 'Open client'),
      ],
    }))
  }
  await db().from('clients').update({ notified_trainee_id: now }).eq('id', c.id)
  return 'sent'
})

// ---------- bookings ----------

export async function emailBooking(sessionId: string, event: 'booked' | 'rescheduled' | 'cancelled') {
  const { data: s } = await db().from('sessions').select('*').eq('id', sessionId).maybeSingle<Session>()
  if (!s) return
  const [c, t] = await Promise.all([client(s.client_id), trainee(s.trainee_id)])
  if (!c || !t) return
  const what = KINDS[s.kind].label
  const when = fmtDateTime(s.scheduled_at)
  const verb = { booked: 'Booked', rescheduled: 'Rescheduled', cancelled: 'Cancelled' }[event]
  const details = [`${what}, ${s.duration_min} minutes`, `${when} (India time)`, ...(s.meeting_link && event !== 'cancelled' ? [`Join: ${s.meeting_link}`] : [])]
  for (const [to, other, href] of [[c.email, t.full_name, `${SITE}/client`], [t.email, c.full_name, `${SITE}/trainee/sessions`]] as const) {
    await queueEmail({
      kind: `session_${event}`, to, subject: `${verb}: ${what.toLowerCase()} with ${first(other)} · ${when}`,
      html: layout({
        site: SITE, preheader: `${verb} for ${when}.`, heading: `${verb}: ${what.toLowerCase()}`,
        blocks: [box(`With ${other}`, details), event === 'cancelled' ? p('This session will not take place.') : p('You can reschedule or cancel from your dashboard. Please give at least 24 hours’ notice.'), button(href, 'Open my dashboard')],
      }),
    })
  }
}
