import Link from 'next/link'
import { notFound } from 'next/navigation'
import { loadEverything, earningsFor } from '@/lib/data'
import { ActionForm, Submit } from '@/components/ActionForm'
import { CopyLink } from '@/components/CopyLink'
import { ConsentView } from '@/components/ConsentView'
import { AnswersView } from '@/components/AnswersView'
import { SessionList } from '@/components/SessionList'
import { Pill } from '@/components/Pill'
import { Stat } from '@/components/Stat'
import { deleteTrainee, emailOnboardingLink, newTraineeLink, updateTrainee, updateTraineePublic, uploadTraineePhoto } from '../../actions'
import { Avatar, PhotoInput } from '@/components/PhotoInput'
import { ProfileFields } from '@/components/ProfileFields'
import { TRAINEE_FEEDBACK, CLIENT_FEEDBACK } from '@/lib/forms'
import { fmtDate } from '@/lib/format'
import { inr, therapyDone } from '@/lib/money'
import { origin } from '@/lib/site'
import { db } from '@/lib/supabase'

const STATUSES = ['invited', 'onboarded', 'active', 'paused', 'completed']

export default async function TraineeDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ invited?: string }> }) {
  const [{ id }, { invited }] = await Promise.all([params, searchParams])
  const d = await loadEverything()
  const t = d.trainees.find((x) => x.id === id)
  if (!t) notFound()

  const invite = d.invites.find((i) => i.trainee_id === t.id && i.kind === 'trainee_onboarding' && !i.used_at && new Date(i.expires_at) > new Date())
  const consent = d.consents.find((c) => c.kind === 'trainee' && c.trainee_id === t.id) ?? null
  const clients = d.clients.filter((c) => c.trainee_id === t.id)
  const names = Object.fromEntries(d.clients.map((c) => [c.id, c.full_name]))
  const sessions = d.sessions.filter((s) => s.trainee_id === t.id).reverse()
  const m = earningsFor(t.id, d.sessions)
  const feedback = d.traineeFeedback.filter((f) => f.trainee_id === t.id)
  const fromClients = d.clientFeedback.filter((f) => f.trainee_id === t.id)
  const base = await origin()
  const { data: cal } = await db().from('google_accounts').select('google_email, last_error').eq('trainee_id', t.id).maybeSingle()
  const cohortName = d.cohorts.find((c) => c.id === t.cohort_id)?.name
  const hasHours = Object.values(t.availability ?? {}).some((r) => r?.length)
  const missing = [!t.photo_url && 'photo', !t.bio && 'about', !hasHours && 'hours'].filter(Boolean) as string[]

  return (
    <>
      <Link className="crumb" href="/admin/trainees">← Trainees</Link>
      <div className="head">
        <div className="row" style={{ gap: 14 }}>
          <Avatar src={t.photo_url} name={t.full_name} size={64} />
          <div><h1>{t.full_name}</h1><p className="muted">{t.email} · <Pill status={t.status} />{t.cohort_id ? ` · ${d.cohorts.find((c) => c.id === t.cohort_id)?.name ?? ''}` : ''}</p></div>
        </div>
      </div>

      {(invite || invited) && (
        <section className="card" style={{ marginBottom: 16 }}>
          <h2>Onboarding link</h2>
          {invited && <p className="note ok" style={{ marginBottom: 12 }}>Trainee added. Send them this link.</p>}
          {invite ? (
            <CopyLink url={`${base}/join/${invite.token}`} whatsapp={t.phone} message={`Hi ${t.full_name.split(' ')[0]}! Please complete your Kirana Counselling onboarding & consent form (sign in with ${t.email}):`} />
          ) : <p className="muted">No active link.</p>}
          <p className="fine sp">Expires {invite ? fmtDate(invite.expires_at) : '—'}.</p>
          <ActionForm action={emailOnboardingLink} className="row sp">
            <input type="hidden" name="trainee_id" value={t.id} />
            <Submit className="btn small" pendingText="Sending…">Email this link to {t.email}</Submit>
          </ActionForm>
        </section>
      )}
      {!invite && !consent && (
        <ActionForm action={newTraineeLink} className="row" >
          <input type="hidden" name="trainee_id" value={t.id} />
          <Submit className="btn ghost small">Create a new onboarding link</Submit>
        </ActionForm>
      )}

      <div className="grid g3 sp">
        <Stat n={clients.length} label="Clients" />
        <Stat n={sessions.filter(therapyDone).length} label="Sessions done" sub={`${m.free} free · ${m.billable} paid`} />
        <Stat n={inr(m.earned)} label="Earned" sub={`${inr(m.collected)} marked paid by clients`} berry />
      </div>

      <div className="stack sp">
        <details className="card fold">
          <summary>
            <h2>Details &amp; notes</h2>
            <span className="fine">{[cohortName, t.phone, t.upi_id ? 'UPI added' : 'no UPI'].filter(Boolean).join(' · ')}</span>
          </summary>
          <ActionForm action={updateTrainee} className="form-grid">
            <input type="hidden" name="id" value={t.id} />
            <label className="field"><span>Full name</span><input name="full_name" defaultValue={t.full_name} required /></label>
            <label className="field"><span>Email (Google login)</span><input name="email" type="email" defaultValue={t.email} required /></label>
            <label className="field"><span>WhatsApp</span><input name="phone" defaultValue={t.phone ?? ''} /></label>
            <label className="field"><span>Cohort</span>
              <select name="cohort_id" defaultValue={t.cohort_id ?? ''}><option value="">No cohort</option>{d.cohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </label>
            <label className="field"><span>Status</span>
              <select name="status" defaultValue={t.status}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
            </label>
            <label className="field"><span>UPI ID</span><input name="upi_id" defaultValue={t.upi_id ?? ''} /></label>
            <label className="field full"><span>Instructor notes <small>(only you see these)</small></span><textarea name="admin_notes" defaultValue={t.admin_notes ?? ''} /></label>
            <div className="full row"><Submit>Save details</Submit></div>
          </ActionForm>
          <ActionForm action={deleteTrainee} className="sp" confirm={`Remove ${t.full_name}? Their clients become unassigned.`}>
            <input type="hidden" name="id" value={t.id} />
            <Submit className="link" pendingText="Removing…">Remove trainee</Submit>
          </ActionForm>
        </details>

        <details className="card fold">
          <summary>
            <h2>Onboarding consent</h2>
            {consent ? <span className="pill sage">signed {fmtDate(consent.signed_at)}</span> : <span className="pill invited">not signed yet</span>}
          </summary>
          <ConsentView consent={consent} />
        </details>

        <details className="card fold">
          <summary>
            <h2>Public profile</h2>
            <span className="fold-pills">
              <span className={`pill ${t.is_public ? 'sage' : ''}`}>{t.is_public ? 'visible' : 'hidden'}</span>
              {missing.length ? <span className="pill invited">missing: {missing.join(', ')}</span> : <span className="pill sage">complete</span>}
              <span className={`pill ${cal && !cal.last_error ? 'sage' : 'invited'}`}>{cal ? (cal.last_error ? 'calendar error' : 'calendar connected') : 'no calendar'}</span>
            </span>
          </summary>
          <div className="card-head" style={{ marginBottom: 8 }}>
            <p className="fine">
              Google Calendar: {cal ? (cal.last_error ? <b style={{ color: 'var(--berry)' }}>{cal.last_error}</b> : <>connected ({cal.google_email})</>) : 'not connected (the trainee connects it from their Profile page)'}
            </p>
            {t.slug && <Link className="btn small ghost" href={`/therapists/${t.slug}`} target="_blank">View public page ↗</Link>}
          </div>
          <PhotoInput action={uploadTraineePhoto} current={t.photo_url} name={t.full_name} hidden={{ trainee_id: t.id }} />
          <ActionForm action={updateTraineePublic} className="stack sp">
            <input type="hidden" name="id" value={t.id} />
            <ProfileFields t={t} admin />
            <div><Submit>Save public profile</Submit></div>
          </ActionForm>
        </details>
      </div>

      <div className="grid g2 sp">
        <section className="card span2">
          <h2>Assigned clients <span className="fine">({clients.length})</span></h2>
          {clients.length ? (
            <ul className="feed">
              {clients.map((c) => <li key={c.id}><span><Link href={`/admin/clients/${c.id}`}>{c.full_name}</Link> · <Pill status={c.status} /></span></li>)}
            </ul>
          ) : <p className="empty">No clients assigned. <Link href="/admin/clients?filter=unassigned">Assign one</Link></p>}
        </section>

        <section className="card span2">
          <h2>Sessions</h2>
          <SessionList sessions={sessions} role="admin" names={names} nameKey="client_id" hrefFor={(s) => `/admin/clients/${s.client_id}`} />
        </section>

        <section className="card">
          <h2>Trainee’s feedback to Kirana <span className="fine">({feedback.length})</span></h2>
          {feedback.length ? <div className="stack">{feedback.map((f) => <details className="box" key={f.id}><summary>{fmtDate(f.created_at)}</summary><div className="inner"><AnswersView questions={TRAINEE_FEEDBACK} answers={f.answers} /></div></details>)}</div> : <p className="empty">None yet.</p>}
        </section>
        <section className="card">
          <h2>Client feedback <span className="fine">({fromClients.length})</span></h2>
          {fromClients.length ? <div className="stack">{fromClients.map((f) => <details className="box" key={f.id}><summary>{names[f.client_id!]} · {fmtDate(f.created_at)}</summary><div className="inner"><AnswersView questions={CLIENT_FEEDBACK} answers={f.answers} /></div></details>)}</div> : <p className="empty">None yet.</p>}
        </section>
      </div>
    </>
  )
}
