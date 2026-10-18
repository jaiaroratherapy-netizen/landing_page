import { FREE_SESSIONS, SESSION_FEE } from './forms'
import type { Session } from './types'

export type BilledSession = Session & { number: number | null; fee: number }

/** Completed therapy sessions (not intro calls) are numbered per client in date order; the first three are free, then ₹299 each. */
export function billSessions(sessions: Session[]): BilledSession[] {
  const counter = new Map<string, number>()
  const numbered = new Map<string, { number: number; fee: number }>()
  ;[...sessions]
    .filter((s) => s.status === 'completed' && s.kind !== 'intro')
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    .forEach((s) => {
      const n = (counter.get(s.client_id) ?? 0) + 1
      counter.set(s.client_id, n)
      numbered.set(s.id, { number: n, fee: n > FREE_SESSIONS ? SESSION_FEE : 0 })
    })
  return sessions.map((s) => ({ ...s, number: numbered.get(s.id)?.number ?? null, fee: numbered.get(s.id)?.fee ?? 0 }))
}

/** A completed therapy session (intro calls don't count towards sessions or fees). */
export const therapyDone = (s: Pick<Session, 'status' | 'kind'>) => s.status === 'completed' && s.kind !== 'intro'

export function inr(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}
