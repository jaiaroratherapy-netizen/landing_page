import Link from 'next/link'
import { loadEverything, earningsFor, weekly } from '@/lib/data'
import { Bars } from '@/components/Charts'
import { Stat } from '@/components/Stat'
import { FREE_SESSIONS, SESSION_FEE } from '@/lib/forms'
import { inr, therapyDone } from '@/lib/money'

export default async function Money() {
  const d = await loadEverything()
  const rows = d.trainees.map((t) => ({ t, m: earningsFor(t.id, d.sessions) })).sort((a, b) => b.m.earned - a.m.earned)
  const sum = (k: 'earned' | 'collected' | 'billable' | 'free') => rows.reduce((a, r) => a + r.m[k], 0)
  const completed = d.sessions.filter(therapyDone)
  const chart = weekly(completed, (s) => s.scheduled_at, { free: (s) => +(s.fee === 0), paid: (s) => +(s.fee > 0) })
  const active = rows.filter((r) => r.m.earned || r.m.free)

  return (
    <>
      <div className="head">
        <div>
          <h1>Money</h1>
          <p className="muted">First {FREE_SESSIONS} sessions per client are free; from session {FREE_SESSIONS + 1} it’s {inr(SESSION_FEE)} per session, paid by the client directly to the trainee.</p>
        </div>
      </div>
      <div className="grid g4">
        <Stat n={sum('free')} label="Free sessions given" />
        <Stat n={sum('billable')} label="Paid sessions" />
        <Stat n={inr(sum('earned'))} label="Earned by trainees" berry />
        <Stat n={inr(sum('collected'))} label="Marked paid by clients" sub={`${inr(sum('earned') - sum('collected'))} not marked yet`} />
      </div>

      <div className="grid g2 sp">
        <section className="card span2">
          <h2>Per trainee</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Trainee</th><th className="num">Free sess.</th><th className="num">Paid sess.</th><th className="num">Earned</th><th className="num">Marked paid</th></tr></thead>
              <tbody>
                {active.map(({ t, m }) => (
                  <tr key={t.id}>
                    <td><Link href={`/admin/trainees/${t.id}`}>{t.full_name}</Link></td>
                    <td className="num">{m.free}</td>
                    <td className="num">{m.billable}</td>
                    <td className="num"><b>{inr(m.earned)}</b></td>
                    <td className="num">{inr(m.collected)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!active.length && <p className="empty">No completed sessions yet.</p>}
          </div>
        </section>
        <section className="card span2">
          <h2>Free vs paid sessions</h2>
          <Bars data={chart} x="week" series={[{ key: 'free', name: 'Free (1–3)', color: '#B3C6A0', stack: 'm' }, { key: 'paid', name: 'Paid (4+)', color: '#4A1E48', stack: 'm' }]} />
        </section>
      </div>
    </>
  )
}
