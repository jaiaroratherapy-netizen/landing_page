import Link from 'next/link'
import { notFound } from 'next/navigation'
import { assignOptions, loadEverything } from '@/lib/data'
import { ActionForm, Submit } from '@/components/ActionForm'
import { AssignForm } from '@/components/AssignForm'
import { ConsentView } from '@/components/ConsentView'
import { AnswersView } from '@/components/AnswersView'
import { SessionList, BookForm } from '@/components/SessionList'
import { TrackingView } from '@/components/Tracking'
import { Pill } from '@/components/Pill'
import { updateClient } from '../../actions'
import { bookSession } from '@/app/actions/sessions'
import { CLIENT_FEEDBACK } from '@/lib/forms'
import { fmtDate } from '@/lib/format'

const STATUSES = ['unassigned', 'assigned', 'active', 'paused', 'dropped', 'completed']

export default async function ClientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const d = await loadEverything()
  const c = d.clients.find((x) => x.id === id)
  if (!c) notFound()
  const trainee = d.trainees.find((t) => t.id === c.trainee_id)
  const consent = d.consents.find((x) => x.kind === 'client' && x.client_id === c.id) ?? null
  const sessions = d.sessions.filter((s) => s.client_id === c.id).reverse()
  const tracking = d.tracking.find((t) => t.client_id === c.id) ?? null
  const feedback = d.clientFeedback.filter((f) => f.client_id === c.id)
  const names = Object.fromEntries(d.trainees.map((t) => [t.id, t.full_name]))

  return (
    <>
      <Link className="crumb" href="/admin/clients">← Clients</Link>
      <div className="head">
        <div>
          <h1>{c.full_name}</h1>
          <p className="muted">{c.email} · <Pill status={c.status} /> {c.self_harm === 'Yes' && <span className="pill berry">self-harm: yes</span>}</p>
        </div>
        <div className="stack" style={{ gap: 6 }}>
          <span className="fine">Therapist {trainee && <>· <Link href={`/admin/trainees/${trainee.id}`}>{trainee.full_name}</Link></>}</span>
          <AssignForm clientId={c.id} clientName={c.full_name} current={c.trainee_id} trainees={assignOptions(d)} />
        </div>
      </div>

      <div className="grid g2">
        <section className="card">
          <h2>Sign-up details</h2>
          <dl className="kv">
            <dt>WhatsApp</dt><dd>{c.whatsapp ? <a href={`https://wa.me/91${c.whatsapp}`}>{c.whatsapp}</a> : '—'}</dd>
            <dt>College / org</dt><dd>{c.org ?? '—'}</dd>
            <dt>What brings them</dt><dd>{c.reason ?? '—'}</dd>
            <dt>Diagnosis</dt><dd>{c.diagnosis ?? '—'}</dd>
            <dt>Self-harm thoughts</dt><dd>{c.self_harm ?? '—'}</dd>
            <dt>Therapist preference</dt><dd>{c.pref ?? '—'}</dd>
            <dt>Emergency contact</dt><dd>{c.emergency_contact ?? '—'}</dd>
            <dt>Signed up</dt><dd>{fmtDate(c.created_at)}</dd>
          </dl>
          <h3 className="sp" style={{ marginBottom: 8 }}>Aadhaar verification</h3>
          <dl className="kv">
            <dt>Result</dt><dd>{c.id_verified_by ? `✓ UIDAI signature valid (${c.id_verified_by})` : '—'}</dd>
            <dt>Aadhaar</dt><dd>XXXX XXXX {c.aadhaar_last4 ?? '????'}</dd>
            <dt>Born</dt><dd>{c.birth_year ?? '—'} {c.gender ? `· ${c.gender}` : ''}</dd>
            <dt>Mobile matches Aadhaar</dt><dd>{c.mobile_match === null ? 'Not checkable' : c.mobile_match ? 'Yes' : 'No'}</dd>
            <dt>QR generated</dt><dd>{c.qr_generated_at ?? '—'}</dd>
          </dl>
        </section>

        <section className="card">
          <h2>Edit</h2>
          <ActionForm action={updateClient} className="form-grid">
            <input type="hidden" name="id" value={c.id} />
            <label className="field"><span>Login email</span><input name="email" type="email" defaultValue={c.email} required /></label>
            <label className="field"><span>WhatsApp</span><input name="whatsapp" defaultValue={c.whatsapp ?? ''} /></label>
            <label className="field"><span>Status</span><select name="status" defaultValue={c.status}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>
            <label className="field"><span>Pronouns</span><input name="pronouns" defaultValue={c.pronouns ?? ''} /></label>
            <label className="field full"><span>Instructor notes</span><textarea name="admin_notes" defaultValue={c.admin_notes ?? ''} /></label>
            <div className="full"><Submit>Save</Submit></div>
          </ActionForm>
        </section>

        <section className="card">
          <h2>Consent form</h2>
          <ConsentView consent={consent} />
        </section>

        <section className="card">
          <h2>Therapist’s tracking</h2>
          <TrackingView t={tracking} />
        </section>

        <section className="card span2">
          <h2>Sessions</h2>
          <SessionList sessions={sessions} role="admin" names={names} nameKey="trainee_id" />
          {c.trainee_id && <details className="box sp"><summary>Book a session</summary><div className="inner"><BookForm action={bookSession} hideClient={c.id} /></div></details>}
        </section>

        <section className="card span2">
          <h2>Client feedback</h2>
          {feedback.length ? <div className="stack">{feedback.map((f) => <details className="box" key={f.id} open><summary>{fmtDate(f.created_at)}</summary><div className="inner"><AnswersView questions={CLIENT_FEEDBACK} answers={f.answers} /></div></details>)}</div> : <p className="empty">No feedback yet.</p>}
        </section>
      </div>
    </>
  )
}
