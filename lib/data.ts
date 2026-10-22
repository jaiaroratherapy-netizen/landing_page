import 'server-only'
import { db } from './supabase'
import { requireRole } from './auth'
import { billSessions, therapyDone, type BilledSession } from './money'
import { weekKey, shortDay } from './format'
import type { Activity, Client, Cohort, Consent, Feedback, Invite, Payout, Session, Trainee, Tracking } from './types'

async function all<T>(table: string, order = 'created_at', ascending = false) {
  const { data, error } = await db().from(table).select('*').order(order, { ascending }).limit(5000)
  if (error) throw new Error(`${table}: ${error.message}`)
  return (data ?? []) as T[]
}

/** Everything, for the admin views. Fine at Kirana's scale (hundreds of rows). */
export async function loadEverything() {
  // checked here, not only in the layout: pages render in parallel with layouts and alone on client navigation
  await requireRole('admin')
  const [cohorts, trainees, clients, sessions, consents, tracking, traineeFeedback, clientFeedback, payouts, invites] = await Promise.all([
    all<Cohort>('cohorts', 'starts_on'),
    all<Trainee>('trainees'),
    all<Client>('clients'),
    all<Session>('sessions', 'scheduled_at'),
    all<Consent>('consents', 'signed_at'),
    all<Tracking>('client_tracking', 'updated_at'),
    all<Feedback>('trainee_feedback'),
    all<Feedback>('client_feedback'),
    all<Payout>('payouts', 'paid_on'),
    all<Invite>('invites'),
  ])
  return { cohorts, trainees, clients, sessions: billSessions(sessions), consents, tracking, traineeFeedback, clientFeedback, payouts, invites }
}

export async function recentActivity(limit = 25) {
  await requireRole('admin')
  const { data } = await db().from('activity').select('*').order('created_at', { ascending: false }).limit(limit)
  return (data ?? []) as Activity[]
}

/** Everything a trainee may see: their clients and those clients' sessions, consents, tracking and client feedback. */
export async function loadForTrainee(traineeId: string) {
  // one parallel round: related rows are filtered through their client's current therapist (inner join)
  const viaClient = (table: string) =>
    db().from(table).select('*, clients!inner(trainee_id)').eq('clients.trainee_id', traineeId)
  const [{ data: clients }, sessions, consents, tracking, clientFeedback, invites] = await Promise.all([
    db().from('clients').select('*').eq('trainee_id', traineeId).order('assigned_at', { ascending: false }),
    viaClient('sessions').order('scheduled_at'),
    viaClient('consents').eq('kind', 'client').order('signed_at', { ascending: false }),
    viaClient('client_tracking'),
    viaClient('client_feedback').order('created_at', { ascending: false }),
    viaClient('invites').eq('kind', 'client_consent').order('created_at', { ascending: false }),
  ])
  const rows = <T,>(r: { data: unknown[] | null }) => (r.data ?? []).map(({ clients: _, ...row }: any) => row) as T[]
  // billing numbers count every completed session of the client, even ones before a reassignment
  const billed = billSessions(rows<Session>(sessions))
  return {
    clients: (clients ?? []) as Client[],
    allSessions: billed,
    sessions: billed.filter((s) => s.trainee_id === traineeId),
    consents: rows<Consent>(consents),
    tracking: rows<Tracking>(tracking),
    clientFeedback: rows<Feedback>(clientFeedback),
    invites: rows<Invite>(invites),
  }
}

// ---------- chart shaping ----------

/** Weekly counts over the last `weeks` weeks (Mon-start, India time). */
export function weekly<T, K extends string>(rows: T[], when: (r: T) => string | null, series: Record<K, (r: T) => number>, weeks = 10) {
  const keys: string[] = []
  const start = new Date(weekKey(new Date().toISOString()))
  for (let i = weeks - 1; i >= 0; i--) keys.push(new Date(start.getTime() - i * 7 * 86400_000).toISOString().slice(0, 10))
  const table = new Map(keys.map((k) => [k, Object.fromEntries(Object.keys(series).map((s) => [s, 0])) as Record<K, number>]))
  rows.forEach((r) => {
    const w = when(r)
    const bucket = w && table.get(weekKey(w))
    if (bucket) (Object.keys(series) as K[]).forEach((s) => { bucket[s] += series[s](r) })
  })
  return keys.map((k) => ({ week: shortDay(k), ...table.get(k)! }) as { week: string } & Record<K, number>)
}

export function countBy<T>(rows: T[], key: (r: T) => string | null | undefined) {
  const m = new Map<string, number>()
  rows.forEach((r) => { const k = key(r) || 'Unknown'; m.set(k, (m.get(k) ?? 0) + 1) })
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

export type Earnings = { billable: number; earned: number; collected: number; free: number }

/** Money per trainee: billable sessions (4th onward) and what clients have paid. Clients pay trainees directly. */
export function earningsFor(traineeId: string, sessions: BilledSession[]): Earnings {
  const done = sessions.filter((s) => s.trainee_id === traineeId && therapyDone(s))
  const billable = done.filter((s) => s.fee > 0)
  const earned = billable.reduce((a, s) => a + s.fee, 0)
  const collected = billable.filter((s) => s.client_paid).reduce((a, s) => a + s.fee, 0)
  return { billable: billable.length, earned, collected, free: done.length - billable.length }
}

/** Trainees who can take clients, with their cohort and current client count, for the assign dialog. */
export function assignOptions(d: { trainees: Trainee[]; clients: Client[]; cohorts: Cohort[] }) {
  const load = new Map<string, number>()
  d.clients.forEach((c) => c.trainee_id && load.set(c.trainee_id, (load.get(c.trainee_id) ?? 0) + 1))
  const cohort = new Map(d.cohorts.map((c) => [c.id, c.name]))
  return d.trainees.filter((t) => t.status !== 'completed').map((t) => ({
    id: t.id, name: t.full_name, email: t.email, cohort: t.cohort_id ? cohort.get(t.cohort_id) ?? null : null, load: load.get(t.id) ?? 0, invited: t.status === 'invited',
  }))
}
