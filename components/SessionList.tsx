import Link from 'next/link'
import { ActionForm, Submit } from './ActionForm'
import { Pill } from './Pill'
import { cancelSession, rescheduleSession, updateSessionStatus } from '@/app/actions/sessions'
import { fmtDateTime, isoToIstInput } from '@/lib/format'
import { inr, type BilledSession } from '@/lib/money'
import type { Role } from '@/lib/auth'

type Props = {
  sessions: BilledSession[]
  role: Role
  names?: Record<string, string>
  nameKey?: 'client_id' | 'trainee_id'
  feedbackGiven?: Set<string>
  hrefFor?: (s: BilledSession) => string
  /** clients reschedule through the slot picker */
  rescheduleHref?: (s: BilledSession) => string | null
  empty?: string
}

export function SessionList({ sessions, role, names, nameKey, feedbackGiven, hrefFor, rescheduleHref, empty = 'No sessions yet.' }: Props) {
  if (!sessions.length) return <p className="empty">{empty}</p>
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>When</th>
            {nameKey && <th>{nameKey === 'client_id' ? 'Client' : 'Therapist'}</th>}
            <th>Session</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => {
            const name = nameKey && names?.[s[nameKey]]
            const upcoming = s.status === 'scheduled'
            return (
              <tr key={s.id}>
                <td>
                  <b>{fmtDateTime(s.scheduled_at)}</b>
                  <div className="fine">{s.duration_min} min{s.reschedule_count ? ` · rescheduled ${s.reschedule_count}×` : ''}</div>
                </td>
                {nameKey && <td>{hrefFor ? <Link href={hrefFor(s)}>{name ?? '—'}</Link> : name ?? '—'}</td>}
                <td>
                  {s.kind === 'intro' ? <span className="pill assigned">Intro call · free</span>
                    : s.number ? <>#{s.number} · {s.fee ? inr(s.fee) : 'Free'}</> : <span className="muted">Session</span>}
                  {s.fee > 0 && role !== 'client' && <div className="fine">{s.client_paid ? 'Paid ✓' : 'Payment pending'}</div>}
                </td>
                <td>
                  <Pill status={s.status} />
                  {s.status === 'cancelled' && s.cancelled_by && <div className="fine">by {s.cancelled_by}{s.cancel_reason ? `: ${s.cancel_reason}` : ''}</div>}
                </td>
                <td style={{ minWidth: 200 }}>
                  <div className="stack" style={{ gap: 8, alignItems: 'flex-end' }}>
                    {upcoming && s.meeting_link && <a className="btn small" href={s.meeting_link} target="_blank" rel="noreferrer">Join call</a>}
                    {upcoming && <a className="fine" href={`/api/ics/${s.id}`}>Add to calendar</a>}
                    {role === 'client' && s.status === 'completed' && !feedbackGiven?.has(s.id) && (
                      <Link className="btn small berry" href={`/client/feedback/${s.id}`}>Give feedback</Link>
                    )}
                    {role === 'client' && s.status === 'completed' && feedbackGiven?.has(s.id) && <span className="fine">Feedback sent ✓</span>}
                    <Manage s={s} role={role} rescheduleHref={rescheduleHref?.(s) ?? null} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Manage({ s, role, rescheduleHref }: { s: BilledSession; role: Role; rescheduleHref: string | null }) {
  const upcoming = s.status === 'scheduled'
  if (role === 'client' && !upcoming) return null
  return (
    <details className="box" style={{ width: '100%', maxWidth: 320, textAlign: 'left' }}>
      <summary>Manage</summary>
      <div className="inner stack">
        {upcoming && role === 'client' && rescheduleHref && <Link className="btn small" href={rescheduleHref}>Pick a new time</Link>}
        {upcoming && role !== 'client' && (
          <ActionForm action={rescheduleSession} className="stack">
            <input type="hidden" name="id" value={s.id} />
            <label className="field"><span>New time (IST)</span>
              <input type="datetime-local" name="scheduled_at" defaultValue={isoToIstInput(s.scheduled_at)} required />
            </label>
            <Submit className="btn small">Reschedule</Submit>
          </ActionForm>
        )}
        {upcoming && (
          <ActionForm action={cancelSession} className="stack" confirm="Cancel this session?">
            <input type="hidden" name="id" value={s.id} />
            <label className="field"><span>Reason (optional)</span><input name="reason" /></label>
            <Submit className="btn small ghost">Cancel session</Submit>
          </ActionForm>
        )}
        {role !== 'client' && (
          <ActionForm action={updateSessionStatus} className="stack">
            <input type="hidden" name="id" value={s.id} />
            <label className="field"><span>Status</span>
              <select name="status" defaultValue={s.status}>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="no_show">No-show</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label className="field"><span>Meeting link</span><input name="meeting_link" defaultValue={s.meeting_link ?? ''} placeholder="https://meet.google.com/…" /></label>
            <label className="field"><span>Client paid? <small>(only from session 4)</small></span>
              <select name="client_paid" defaultValue={s.client_paid ? 'yes' : 'no'}>
                <option value="no">Not yet</option>
                <option value="yes">Yes, paid</option>
              </select>
            </label>
            <label className="field"><span>Private notes</span><textarea name="trainee_notes" defaultValue={s.trainee_notes ?? ''} /></label>
            <Submit className="btn small">Save</Submit>
          </ActionForm>
        )}
      </div>
    </details>
  )
}

/** Free-form booking for trainees and admins (clients use the slot picker at /book). */
export function BookForm({ action, clients, hideClient }: {
  action: (fd: FormData) => Promise<{ ok?: string; error?: string }>
  clients?: { id: string; full_name: string }[]
  hideClient?: string
}) {
  return (
    <ActionForm action={action} className="form-grid" resetOnSuccess>
      {hideClient ? <input type="hidden" name="client_id" value={hideClient} /> : clients && (
        <label className="field"><span>Client</span>
          <select name="client_id" required defaultValue="">
            <option value="" disabled>Choose…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
        </label>
      )}
      <label className="field"><span>Type</span>
        <select name="kind" defaultValue="session"><option value="session">Therapy session (50 min)</option><option value="intro">Intro call (20 min, free)</option></select>
      </label>
      <label className="field"><span>Date & time (IST)</span><input type="datetime-local" name="scheduled_at" required /></label>
      <label className="field"><span>Meeting link</span><small>Leave empty to get a Google Meet link when your calendar is connected</small><input name="meeting_link" placeholder="https://meet.google.com/…" /></label>
      <div className="full"><Submit>Book session</Submit></div>
    </ActionForm>
  )
}
