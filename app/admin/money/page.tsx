import Link from 'next/link'
import { loadEverything, earningsFor, weekly } from '@/lib/data'
import { ActionForm, Submit } from '@/components/ActionForm'
import { Bars } from '@/components/Charts'
import { Stat } from '@/components/Stat'
import { deletePayout, recordPayout } from '../actions'
import { FREE_SESSIONS, SESSION_FEE } from '@/lib/forms'
import { fmtDate, todayIst } from '@/lib/format'
import { inr, therapyDone } from '@/lib/money'

export default async function Money() {
  const d = await loadEverything()
  const rows = d.trainees.map((t) => ({ t, m: earningsFor(t.id, d.sessions, d.payouts) })).sort((a, b) => b.m.due - a.m.due)
  const sum = (k: 'earned' | 'collected' | 'paidOut' | 'due' | 'billable' | 'free') => rows.reduce((a, r) => a + r.m[k], 0)
  const names = Object.fromEntries(d.trainees.map((t) => [t.id, t.full_name]))
  const completed = d.sessions.filter(therapyDone)
  const chart = weekly(completed, (s) => s.scheduled_at, { free: (s) => +(s.fee === 0), paid: (s) => +(s.fee > 0) })

  return (
    <>
      <div className="head">
        <div>
          <h1>Money</h1>
          <p className="muted">First {FREE_SESSIONS} sessions per client are free; from session {FREE_SESSIONS + 1} it’s {inr(SESSION_FEE)} per session, all of it going to the trainee.</p>
        </div>
      </div>
      <div className="grid g4">
        <Stat n={inr(sum('earned'))} label="Earned by trainees" sub={`${sum('billable')} paid sessions`} />
        <Stat n={inr(sum('collected'))} label="Marked paid by clients" sub={`${inr(sum('earned') - sum('collected'))} not yet marked`} />
        <Stat n={inr(sum('paidOut'))} label="Paid out to trainees" />
        <Stat n={inr(sum('due'))} label="Still to pay trainees" berry />
      </div>

      <div className="grid g2 sp">
        <section className="card span2">
          <h2>Who you need to pay</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Trainee</th><th>UPI</th><th className="num">Free sess.</th><th className="num">Paid sess.</th><th className="num">Earned</th><th className="num">Collected</th><th className="num">Paid out</th><th className="num">Due</th></tr></thead>
              <tbody>
                {rows.filter((r) => r.m.earned || r.m.paidOut || r.m.free).map(({ t, m }) => (
                  <tr key={t.id}>
                    <td><Link href={`/admin/trainees/${t.id}`}>{t.full_name}</Link></td>
                    <td className="fine">{t.upi_id ?? '—'}</td>
                    <td className="num">{m.free}</td>
                    <td className="num">{m.billable}</td>
                    <td className="num">{inr(m.earned)}</td>
                    <td className="num">{inr(m.collected)}</td>
                    <td className="num">{inr(m.paidOut)}</td>
                    <td className="num"><b style={{ color: m.due ? 'var(--berry)' : undefined }}>{inr(m.due)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.some((r) => r.m.earned || r.m.paidOut || r.m.free) && <p className="empty">No completed sessions yet.</p>}
          </div>
        </section>

        <section className="card">
          <h2>Free vs paid sessions</h2>
          <Bars data={chart} x="week" series={[{ key: 'free', name: 'Free (1–3)', color: '#B3C6A0', stack: 'm' }, { key: 'paid', name: 'Paid (4+)', color: '#4A1E48', stack: 'm' }]} />
        </section>

        <section className="card">
          <h2>Record a payout</h2>
          <ActionForm action={recordPayout} className="form-grid" resetOnSuccess>
            <label className="field full"><span>Trainee</span>
              <select name="trainee_id" required defaultValue="">
                <option value="" disabled>Choose…</option>
                {rows.map(({ t, m }) => <option key={t.id} value={t.id}>{t.full_name}{m.due ? ` (due ${inr(m.due)})` : ''}</option>)}
              </select>
            </label>
            <label className="field"><span>Amount (₹)</span><input name="amount" type="number" min="1" required /></label>
            <label className="field"><span>Paid on</span><input name="paid_on" type="date" defaultValue={todayIst()} /></label>
            <label className="field"><span>UPI / reference</span><input name="reference" /></label>
            <label className="field"><span>Note</span><input name="note" /></label>
            <div className="full"><Submit>Record payout</Submit></div>
          </ActionForm>
        </section>

        <section className="card span2">
          <h2>Payout history</h2>
          {d.payouts.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Trainee</th><th className="num">Amount</th><th>Reference</th><th></th></tr></thead>
                <tbody>
                  {d.payouts.map((p) => (
                    <tr key={p.id}>
                      <td>{fmtDate(p.paid_on)}</td><td>{names[p.trainee_id]}</td><td className="num">{inr(p.amount)}</td>
                      <td className="fine">{[p.reference, p.note].filter(Boolean).join(' · ') || '—'}</td>
                      <td><ActionForm action={deletePayout} confirm="Delete this payout record?"><input type="hidden" name="id" value={p.id} /><Submit className="link">Delete</Submit></ActionForm></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="empty">No payouts recorded yet.</p>}
        </section>
      </div>
    </>
  )
}
