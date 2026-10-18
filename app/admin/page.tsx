import Link from 'next/link'
import { loadEverything, recentActivity, weekly, countBy, earningsFor } from '@/lib/data'
import { Bars, Donut, Lines } from '@/components/Charts'
import { CONSENT_ITEMS } from '@/lib/forms'
import { fmtDateTime } from '@/lib/format'
import { inr } from '@/lib/money'
import { Stat } from '@/components/Stat'

export default async function Overview() {
  const d = await loadEverything()
  const activity = await recentActivity(20)
  const now = Date.now()

  const completed = d.sessions.filter((s) => s.status === 'completed')
  const upcoming = d.sessions.filter((s) => s.status === 'scheduled' && new Date(s.scheduled_at).getTime() > now)
  const unassigned = d.clients.filter((c) => !c.trainee_id)
  const flagged = d.clients.filter((c) => c.self_harm === 'Yes' && !['dropped', 'completed'].includes(c.status))
  const clientConsents = d.consents.filter((c) => c.kind === 'client')
  const consentedClients = new Set(clientConsents.map((c) => c.client_id))
  const money = d.trainees.map((t) => earningsFor(t.id, d.sessions, d.payouts))
  const totals = money.reduce((a, m) => ({ earned: a.earned + m.earned, due: a.due + m.due, paidOut: a.paidOut + m.paidOut, collected: a.collected + m.collected }), { earned: 0, due: 0, paidOut: 0, collected: 0 })
  const sessionsPerClient = new Map<string, number>()
  completed.forEach((s) => sessionsPerClient.set(s.client_id, (sessionsPerClient.get(s.client_id) ?? 0) + 1))

  const funnel = [
    ['Signed up', d.clients.length],
    ['Assigned a therapist', d.clients.filter((c) => c.trainee_id).length],
    ['Consent signed', consentedClients.size],
    ['Intro call done', d.tracking.filter((t) => t.intro_call).length],
    ['First session done', d.clients.filter((c) => (sessionsPerClient.get(c.id) ?? 0) >= 1).length],
    ['Reached paid sessions (4+)', d.clients.filter((c) => (sessionsPerClient.get(c.id) ?? 0) >= 4).length],
    ['Moving to private practice', d.tracking.filter((t) => t.private_practice).length],
  ] as const
  const top = Math.max(1, funnel[0][1])

  const sessionWeeks = weekly(d.sessions, (s) => s.scheduled_at, {
    completed: (s) => +(s.status === 'completed'),
    scheduled: (s) => +(s.status === 'scheduled'),
    missed: (s) => +(s.status === 'cancelled' || s.status === 'no_show'),
  })
  const signupWeeks = weekly(d.clients, (c) => c.created_at, { clients: () => 1 })
  const revenueWeeks = weekly(completed, (s) => s.scheduled_at, { revenue: (s) => s.fee })

  const perTrainee = d.trainees
    .filter((t) => t.status !== 'invited')
    .map((t) => ({
      name: t.full_name.split(' ')[0],
      clients: d.clients.filter((c) => c.trainee_id === t.id).length,
      sessions: completed.filter((s) => s.trainee_id === t.id).length,
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 12)

  const consentRates = CONSENT_ITEMS.map((item) => ({
    item: item.key.replace('_', ' '),
    yes: clientConsents.filter((c) => c.answers[item.key]).length,
    no: clientConsents.filter((c) => !c.answers[item.key]).length,
  }))

  const cohortRows = d.cohorts.map((co) => {
    const ts = d.trainees.filter((t) => t.cohort_id === co.id)
    const ids = new Set(ts.map((t) => t.id))
    return { name: co.name, trainees: ts.length, sessions: completed.filter((s) => ids.has(s.trainee_id)).length }
  })

  return (
    <>
      <div className="head">
        <div>
          <h1>Overview</h1>
          <p className="muted">Everything happening across trainees, clients and sessions.</p>
        </div>
        <div className="row">
          <Link className="btn ghost" href="/admin/clients?filter=unassigned">Assign clients ({unassigned.length})</Link>
          <Link className="btn" href="/admin/trainees#invite">Invite a trainee</Link>
        </div>
      </div>

      {flagged.length > 0 && (
        <p className="note bad" style={{ marginBottom: 16 }}>
          ⚠ {flagged.length} active client{flagged.length > 1 ? 's' : ''} answered “Yes” to self-harm at sign-up:{' '}
          {flagged.map((c, i) => <span key={c.id}>{i ? ', ' : ''}<Link href={`/admin/clients/${c.id}`}>{c.full_name}</Link></span>)}
        </p>
      )}

      <div className="grid g4">
        <Stat n={d.trainees.length} label="Trainees" sub={`${d.trainees.filter((t) => t.status === 'invited').length} yet to onboard`} />
        <Stat n={d.clients.length} label="Clients" sub={`${unassigned.length} waiting for a therapist`} />
        <Stat n={completed.length} label="Sessions completed" sub={`${upcoming.length} upcoming`} />
        <Stat n={inr(totals.due)} label="Owed to trainees" sub={`${inr(totals.earned)} earned · ${inr(totals.paidOut)} paid`} berry />
      </div>

      <div className="grid g2 sp">
        <section className="card span2">
          <div className="card-head"><h2>Sessions per week</h2><span className="fine">last 10 weeks</span></div>
          <Bars data={sessionWeeks} x="week" tall series={[
            { key: 'completed', name: 'Completed', color: '#4F6B41', stack: 'a' },
            { key: 'scheduled', name: 'Scheduled', color: '#C9952B', stack: 'a' },
            { key: 'missed', name: 'Cancelled / no-show', color: '#A62B4E', stack: 'a' },
          ]} />
        </section>

        <section className="card">
          <h2>Client journey</h2>
          <div className="funnel">
            {funnel.map(([label, n]) => (
              <div key={label}><span>{label}</span><span className="bar"><i style={{ width: `${(n / top) * 100}%` }} /></span><b>{n}</b></div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>New client sign-ups</h2>
          <Lines data={signupWeeks} x="week" series={[{ key: 'clients', name: 'Sign-ups', color: '#A62B4E' }]} />
        </section>

        <section className="card">
          <h2>Trainee load</h2>
          <Bars data={perTrainee} x="name" series={[{ key: 'clients', name: 'Clients' }, { key: 'sessions', name: 'Sessions done' }]} />
        </section>

        <section className="card">
          <h2>Paid-session value per week</h2>
          <Bars data={revenueWeeks} x="week" money series={[{ key: 'revenue', name: 'Value', color: '#C9952B' }]} />
        </section>

        <section className="card">
          <h2>Client status</h2>
          <Donut data={countBy(d.clients, (c) => c.status)} />
        </section>

        <section className="card">
          <h2>Session outcomes</h2>
          <Donut data={countBy(d.sessions, (s) => s.status.replace('_', '-'))} />
        </section>

        <section className="card span2">
          <div className="card-head"><h2>Client consent answers</h2><span className="fine">{clientConsents.length} signed forms</span></div>
          <Bars data={consentRates} x="item" series={[{ key: 'yes', name: 'Yes', color: '#4F6B41', stack: 'c' }, { key: 'no', name: 'No', color: '#A62B4E', stack: 'c' }]} />
        </section>

        <section className="card">
          <h2>Cohorts</h2>
          {cohortRows.length ? <Bars data={cohortRows} x="name" series={[{ key: 'trainees', name: 'Trainees' }, { key: 'sessions', name: 'Sessions done' }]} /> : <p className="empty">No cohorts yet. <Link href="/admin/cohorts">Create one</Link></p>}
        </section>

        <section className="card">
          <h2>Why clients drop out</h2>
          {d.tracking.some((t) => t.dropped_out) ? (
            <ul className="feed">
              {d.tracking.filter((t) => t.dropped_out).slice(0, 8).map((t) => (
                <li key={t.client_id}>
                  <time>after {t.dropout_after ?? '?'} sess.</time>
                  <span>{t.dropout_reason || <i className="muted">No reason given</i>} · <Link href={`/admin/clients/${t.client_id}`}>{d.clients.find((c) => c.id === t.client_id)?.full_name}</Link></span>
                </li>
              ))}
            </ul>
          ) : <p className="empty">No drop-outs recorded.</p>}
          <p className="fine sp">Private practice: {d.tracking.filter((t) => t.private_practice).length} clients, avg {inr(avg(d.tracking.filter((t) => t.private_price).map((t) => t.private_price!)))} / session.</p>
        </section>

        <section className="card span2">
          <h2>Recent activity</h2>
          {activity.length ? (
            <ul className="feed">
              {activity.map((a) => (
                <li key={a.id}><time>{fmtDateTime(a.created_at)}</time><span><b>{a.actor}</b> {a.action}{a.detail ? ` · ${a.detail}` : ''}</span></li>
              ))}
            </ul>
          ) : <p className="empty">Nothing yet.</p>}
        </section>
      </div>
    </>
  )
}

function avg(ns: number[]) {
  return ns.length ? Math.round(ns.reduce((a, b) => a + b, 0) / ns.length) : 0
}

