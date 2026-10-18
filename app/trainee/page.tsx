import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/supabase'
import { loadForTrainee, weekly, countBy, earningsFor } from '@/lib/data'
import { Bars, Donut, Lines } from '@/components/Charts'
import { Stat } from '@/components/Stat'
import { SessionList } from '@/components/SessionList'
import { inr, therapyDone } from '@/lib/money'
import type { Invite, Payout } from '@/lib/types'

export default async function TraineeHome() {
  const me = await requireRole('trainee')
  const t = me.trainee
  const [d, payouts, { data: invite }] = await Promise.all([
    loadForTrainee(t.id),
    db().from('payouts').select('*').eq('trainee_id', t.id).then((r) => (r.data ?? []) as Payout[]),
    db().from('invites').select('*').eq('trainee_id', t.id).eq('kind', 'trainee_onboarding').is('used_at', null).gt('expires_at', new Date().toISOString()).maybeSingle<Invite>(),
  ])
  const now = Date.now()
  const m = earningsFor(t.id, d.sessions, payouts)
  const completed = d.sessions.filter(therapyDone)
  const upcoming = d.sessions.filter((s) => s.status === 'scheduled' && new Date(s.scheduled_at).getTime() > now - 3600_000)
  const overdue = d.sessions.filter((s) => s.status === 'scheduled' && new Date(s.scheduled_at).getTime() <= now - 3600_000)
  const names = Object.fromEntries(d.clients.map((c) => [c.id, c.full_name]))
  const consented = new Set(d.consents.map((c) => c.client_id))
  const noConsent = d.clients.filter((c) => !consented.has(c.id))

  const perWeek = weekly(d.sessions, (s) => s.scheduled_at, {
    completed: (s) => +(s.status === 'completed'),
    upcoming: (s) => +(s.status === 'scheduled'),
    missed: (s) => +(s.status === 'cancelled' || s.status === 'no_show'),
  })
  const earningsWeek = weekly(completed, (s) => s.scheduled_at, { earned: (s) => s.fee })
  let running = 0
  const cumulative = earningsWeek.map((w) => ({ week: w.week, total: (running += w.earned) }))
  const perClient = d.clients.map((c) => ({
    name: c.full_name.split(' ')[0],
    free: completed.filter((s) => s.client_id === c.id && s.fee === 0).length,
    paid: completed.filter((s) => s.client_id === c.id && s.fee > 0).length,
  }))

  return (
    <>
      <div className="head">
        <div><h1>Hi {t.full_name.split(' ')[0]} 👋</h1><p className="muted">Here’s how your practice is going.</p></div>
        <Link className="btn" href="/trainee/sessions#book">Book a session</Link>
      </div>

      {t.status === 'invited' && invite && (
        <p className="note warn" style={{ marginBottom: 16 }}>You haven’t finished onboarding yet. <Link href={`/join/${invite.token}`}>Complete your onboarding & consent form →</Link></p>
      )}
      {overdue.length > 0 && (
        <p className="note warn" style={{ marginBottom: 16 }}>{overdue.length} past session{overdue.length > 1 ? 's need' : ' needs'} an update (completed / no-show). <Link href="/trainee/sessions">Update now →</Link></p>
      )}
      {noConsent.length > 0 && (
        <p className="note" style={{ marginBottom: 16 }}>Consent pending for {noConsent.map((c, i) => <span key={c.id}>{i ? ', ' : ''}<Link href={`/trainee/clients/${c.id}`}>{c.full_name}</Link></span>)}. Send them their consent link.</p>
      )}

      <div className="grid g4">
        <Stat n={d.clients.length} label="My clients" sub={`${noConsent.length} consent pending`} />
        <Stat n={upcoming.length} label="Upcoming sessions" />
        <Stat n={completed.length} label="Sessions done" sub={`${m.free} free · ${m.billable} paid`} />
        <Stat n={inr(m.earned)} label="Earned" sub={`${inr(m.paidOut)} paid out · ${inr(m.due)} due`} berry />
      </div>

      <div className="grid g2 sp">
        <section className="card span2">
          <h2>Next sessions</h2>
          <SessionList sessions={upcoming.slice(0, 5)} role="trainee" names={names} nameKey="client_id" hrefFor={(s) => `/trainee/clients/${s.client_id}`} empty="Nothing booked. Book your next session from Sessions." />
        </section>
        <section className="card">
          <h2>Sessions per week</h2>
          <Bars data={perWeek} x="week" series={[
            { key: 'completed', name: 'Completed', color: '#4F6B41', stack: 'a' },
            { key: 'upcoming', name: 'Upcoming', color: '#C9952B', stack: 'a' },
            { key: 'missed', name: 'Cancelled / no-show', color: '#A62B4E', stack: 'a' },
          ]} />
        </section>
        <section className="card">
          <h2>Earnings over time</h2>
          <Lines data={cumulative} x="week" money series={[{ key: 'total', name: 'Total earned', color: '#A62B4E' }]} />
        </section>
        <section className="card">
          <h2>Sessions per client</h2>
          <Bars data={perClient} x="name" series={[{ key: 'free', name: 'Free (1–3)', color: '#B3C6A0', stack: 'c' }, { key: 'paid', name: 'Paid (4+)', color: '#4A1E48', stack: 'c' }]} />
        </section>
        <section className="card">
          <h2>Client status</h2>
          <Donut data={countBy(d.clients, (c) => c.status)} />
        </section>
      </div>
    </>
  )
}
