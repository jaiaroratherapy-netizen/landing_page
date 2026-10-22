import 'server-only'
import { db } from './supabase'
import { DAYS } from './profiles'
import { busyTimes } from './google'
import type { Availability, Trainee } from './types'

import { KINDS, type Kind } from './kinds'
export { KINDS, type Kind }

const STEP_MIN = 30          // slots start on the hour / half hour
const BUFFER_MIN = 10        // gap kept around every booking
const NOTICE_HOURS = 12      // earliest bookable time from now
const HORIZON_DAYS = 21      // how far ahead clients can book
const IST = 330 * 60_000

export type Slot = { start: string; end: string }
export type DaySlots = { date: string; slots: Slot[] }

/** Free start times for a trainee, from their weekly availability minus bookings and Google Calendar busy times. */
export async function freeSlots(trainee: { id: string; availability: Availability | null }, kind: Kind, opts: { ignoreSessionId?: string } = {}): Promise<DaySlots[]> {
  const minutes = KINDS[kind].minutes
  const now = Date.now()
  const from = new Date(now + NOTICE_HOURS * 3600_000)
  const to = new Date(now + HORIZON_DAYS * 86400_000)

  const [{ data: booked }, busy] = await Promise.all([
    db().from('sessions').select('id, scheduled_at, duration_min').eq('trainee_id', trainee.id).eq('status', 'scheduled')
      .gte('scheduled_at', new Date(now - 86400_000).toISOString()).lte('scheduled_at', to.toISOString()),
    busyTimes(trainee.id, from, to).catch(() => []),
  ])
  const blocked = [
    ...(booked ?? []).filter((s) => s.id !== opts.ignoreSessionId).map((s) => {
      const start = new Date(s.scheduled_at).getTime()
      return [start - BUFFER_MIN * 60_000, start + (s.duration_min + BUFFER_MIN) * 60_000]
    }),
    ...busy.map((b) => [new Date(b.start).getTime(), new Date(b.end).getTime()]),
  ]

  const days: DaySlots[] = []
  for (let d = 0; d <= HORIZON_DAYS; d++) {
    // the calendar date in India, d days from today
    const ist = new Date(now + IST + d * 86400_000)
    const ymd = ist.toISOString().slice(0, 10)
    const weekday = DAYS[(ist.getUTCDay() + 6) % 7]
    const slots: Slot[] = []
    for (const w of trainee.availability?.[weekday] ?? []) {
      // minutes past midnight, so "24:00" (midnight) works too
      const dayStart = Date.parse(`${ymd}T00:00:00+05:30`)
      const at = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return dayStart + (h * 60 + m) * 60_000 }
      const winStart = at(w.start_time)
      const winEnd = at(w.end_time)
      for (let t = winStart; t + minutes * 60_000 <= winEnd; t += STEP_MIN * 60_000) {
        const end = t + minutes * 60_000
        if (t < from.getTime() || t > to.getTime()) continue
        if (blocked.some(([a, b]) => t < b && end > a)) continue
        slots.push({ start: new Date(t).toISOString(), end: new Date(end).toISOString() })
      }
    }
    if (slots.length) days.push({ date: ymd, slots })
  }
  return days
}

export async function isFree(trainee: { id: string; availability: Availability | null }, kind: Kind, startIso: string, ignoreSessionId?: string) {
  const days = await freeSlots(trainee, kind, { ignoreSessionId })
  return days.some((d) => d.slots.some((s) => s.start === startIso))
}

// kept out of the 'use server' file so it is not exposed as a callable endpoint
/** Why this client can't book this kind of slot with this therapist (null when they can). */
export async function bookingProblem(clientId: string, clientTraineeId: string | null, t: Trainee, kind: Kind) {
  if (clientTraineeId && clientTraineeId !== t.id) return 'You already have a therapist. Message us on WhatsApp if you would like to change.'
  if (kind === 'session' && clientTraineeId !== t.id) return `Book a free intro call with ${t.full_name.split(' ')[0]} first.`
  const { count: upcoming } = await db().from('sessions').select('id', { head: true, count: 'exact' })
    .eq('client_id', clientId).eq('status', 'scheduled').eq('kind', kind).gt('scheduled_at', new Date().toISOString())
  if (kind === 'intro' && upcoming) return 'You already have an intro call booked. You can reschedule it from your dashboard.'
  if (kind === 'session' && (upcoming ?? 0) >= 2) return 'You already have 2 upcoming sessions. Book the next one after your next session.'
  return null
}
