import Link from 'next/link'
import { loadEverything, earningsFor } from '@/lib/data'
import { db } from '@/lib/supabase'
import { ActionForm, Submit } from '@/components/ActionForm'
import { Pill } from '@/components/Pill'
import { Avatar } from '@/components/PhotoInput'
import { inviteTrainee } from '../actions'
import { inr, therapyDone } from '@/lib/money'

export default async function Trainees({ searchParams }: { searchParams: Promise<{ cohort?: string }> }) {
  const { cohort } = await searchParams
  const d = await loadEverything()
  const { data: cal } = await db().from('google_accounts').select('trainee_id, last_error')
  const calendar = new Map((cal ?? []).map((c) => [c.trainee_id, c.last_error]))
  const cohorts = new Map(d.cohorts.map((c) => [c.id, c.name]))
  const list = cohort ? d.trainees.filter((t) => t.cohort_id === cohort) : d.trainees

  return (
    <>
      <div className="head">
        <div><h1>Trainees</h1><p className="muted">{d.trainees.length} trainee therapists across {d.cohorts.length} cohorts.</p></div>
        <form className="row">
          <Link className="btn ghost small" href="/therapists" target="_blank">Public directory ↗</Link>
          <select name="cohort" defaultValue={cohort ?? ''} aria-label="Filter by cohort">
            <option value="">All cohorts</option>
            {d.cohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn ghost small">Filter</button>
        </form>
      </div>

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Cohort</th><th>Status</th><th className="num">Clients</th><th className="num">Sessions</th><th>Calendar</th><th className="num">Owed</th></tr></thead>
            <tbody>
              {list.map((t) => {
                const m = earningsFor(t.id, d.sessions, d.payouts)
                return (
                  <tr key={t.id}>
                    <td>
                      <div className="row" style={{ flexWrap: 'nowrap' }}>
                        <Avatar src={t.photo_url} name={t.full_name} size={36} />
                        <div><Link href={`/admin/trainees/${t.id}`}>{t.full_name}</Link><div className="fine">{t.email}</div></div>
                      </div>
                    </td>
                    <td>{t.cohort_id ? cohorts.get(t.cohort_id) : <span className="muted">—</span>}</td>
                    <td><Pill status={t.status} /></td>
                    <td className="num">{d.clients.filter((c) => c.trainee_id === t.id).length} / {t.max_clients}</td>
                    <td className="num">{d.sessions.filter((s) => s.trainee_id === t.id && therapyDone(s)).length}</td>
                    <td>{!calendar.has(t.id) ? <span className="muted">—</span> : calendar.get(t.id) ? <span className="pill berry">error</span> : <span className="pill sage">synced</span>}{!t.availability && <div className="fine">no hours set</div>}</td>
                    <td className="num">{inr(m.due)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!list.length && <p className="empty">No trainees yet. Invite one below.</p>}
        </div>
      </section>

      <section className="card sp" id="invite">
        <h2>Invite a trainee</h2>
        <p className="muted" style={{ marginBottom: 14 }}>Creates their profile and a unique onboarding link. They sign in with this Google account and fill the onboarding & consent form.</p>
        <ActionForm action={inviteTrainee} className="form-grid">
          <label className="field"><span>Full name</span><input name="full_name" required /></label>
          <label className="field"><span>Google account email</span><input name="email" type="email" required /></label>
          <label className="field"><span>WhatsApp</span><input name="phone" type="tel" /></label>
          <label className="field"><span>Cohort</span>
            <select name="cohort_id" defaultValue=""><option value="">No cohort yet</option>{d.cohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </label>
          <div className="full"><Submit pendingText="Creating…">Create onboarding link</Submit></div>
        </ActionForm>
      </section>
    </>
  )
}
