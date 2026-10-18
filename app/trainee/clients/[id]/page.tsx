import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { loadForTrainee } from '@/lib/data'
import { ActionForm, Submit } from '@/components/ActionForm'
import { CopyLink } from '@/components/CopyLink'
import { ConsentView } from '@/components/ConsentView'
import { AnswersView } from '@/components/AnswersView'
import { SessionList, BookForm } from '@/components/SessionList'
import { TrackingFields } from '@/components/Tracking'
import { Pill } from '@/components/Pill'
import { createConsentLink, saveTracking } from '../../actions'
import { bookSession } from '@/app/actions/sessions'
import { CLIENT_FEEDBACK } from '@/lib/forms'
import { fmtDate } from '@/lib/format'
import { origin } from '@/lib/site'

export default async function TraineeClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const me = await requireRole('trainee')
  const d = await loadForTrainee(me.trainee.id)
  const c = d.clients.find((x) => x.id === id)
  if (!c) notFound()

  const consent = d.consents.find((x) => x.client_id === c.id) ?? null
  const invite = d.invites.find((i) => i.client_id === c.id && !i.used_at && new Date(i.expires_at) > new Date())
  const sessions = d.allSessions.filter((s) => s.client_id === c.id).reverse()
  const completed = sessions.filter((s) => s.status === 'completed').length
  const tracking = d.tracking.find((t) => t.client_id === c.id) ?? null
  const feedback = d.clientFeedback.filter((f) => f.client_id === c.id)
  const base = await origin()

  return (
    <>
      <Link className="crumb" href="/trainee/clients">← My clients</Link>
      <div className="head">
        <div><h1>{c.full_name}</h1><p className="muted"><Pill status={c.status} /> · assigned {fmtDate(c.assigned_at)}</p></div>
        {c.whatsapp && <a className="btn ghost" href={`https://wa.me/91${c.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp {c.whatsapp}</a>}
      </div>

      {c.self_harm === 'Yes' && (
        <p className="note bad" style={{ marginBottom: 16 }}>At sign-up this client said they have had thoughts of self-harm. Check in on safety early and keep Tele-MANAS (14416) and 112 handy. Talk to your supervisor if you are unsure.</p>
      )}

      <div className="grid g2">
        <section className="card">
          <h2>Profile</h2>
          <dl className="kv">
            <dt>Email</dt><dd>{c.email}</dd>
            <dt>College / org</dt><dd>{c.org ?? '—'}</dd>
            <dt>What brings them</dt><dd>{c.reason ?? '—'}</dd>
            <dt>Diagnosis</dt><dd>{c.diagnosis ?? '—'}</dd>
            <dt>Self-harm thoughts</dt><dd>{c.self_harm ?? '—'}</dd>
            <dt>Therapist preference</dt><dd>{c.pref ?? '—'}</dd>
            <dt>Pronouns</dt><dd>{c.pronouns ?? '—'}</dd>
            <dt>Emergency contact</dt><dd>{c.emergency_contact ?? '—'}</dd>
            <dt>Identity</dt><dd>{c.id_verified_by ? 'Aadhaar verified ✓' : '—'}{c.birth_year ? ` · born ${c.birth_year}` : ''}</dd>
          </dl>
        </section>

        <section className="card">
          <h2>Consent form</h2>
          {consent ? <ConsentView consent={consent} /> : (
            <div className="stack">
              <p className="muted">Send {c.full_name.split(' ')[0]} their unique consent link. It works once and needs no login.</p>
              {invite && <CopyLink url={`${base}/consent/${invite.token}`} whatsapp={c.whatsapp} message={`Hi ${c.full_name.split(' ')[0]}! Before our first session, please fill this Kirana Counselling consent form:`} />}
              <ActionForm action={createConsentLink}>
                <input type="hidden" name="client_id" value={c.id} />
                <Submit className={invite ? 'btn ghost small' : 'btn'} pendingText="Creating…">{invite ? 'Make a new link' : 'Create consent link'}</Submit>
              </ActionForm>
            </div>
          )}
        </section>

        <section className="card span2">
          <div className="card-head"><h2>Sessions</h2><span className="fine">{completed} completed · first 3 free, then ₹299</span></div>
          <SessionList sessions={sessions} role="trainee" empty="No sessions booked yet." />
          <details className="box sp" open={!sessions.length}><summary>Book a session</summary><div className="inner"><BookForm action={bookSession} hideClient={c.id} /></div></details>
        </section>

        <section className="card span2">
          <h2>Client tracking</h2>
          <ActionForm action={saveTracking} className="stack">
            <input type="hidden" name="client_id" value={c.id} />
            <TrackingFields t={tracking} completed={completed} />
            <div><Submit>Save tracking</Submit></div>
          </ActionForm>
        </section>

        <section className="card span2">
          <h2>Feedback from {c.full_name.split(' ')[0]}</h2>
          {feedback.length ? <div className="stack">{feedback.map((f) => <details className="box" key={f.id} open><summary>{fmtDate(f.created_at)}</summary><div className="inner"><AnswersView questions={CLIENT_FEEDBACK} answers={f.answers} /></div></details>)}</div> : <p className="empty">No feedback yet. Clients can leave feedback after each completed session.</p>}
        </section>
      </div>
    </>
  )
}
