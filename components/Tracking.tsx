import { inr } from '@/lib/money'
import type { Tracking } from '@/lib/types'

const yn = (v: boolean | null) => (v === null ? '—' : v ? 'Yes' : 'No')

export function TrackingView({ t }: { t: Tracking | null }) {
  if (!t) return <p className="empty">The therapist hasn’t filled this in yet.</p>
  return (
    <dl className="kv">
      <dt>Took intro call?</dt><dd>{yn(t.intro_call)}</dd>
      <dt>Took first session?</dt><dd>{yn(t.first_session)}</dd>
      <dt>First session feedback</dt><dd>{t.first_session_feedback ?? '—'}</dd>
      <dt>Sessions taken</dt><dd>{t.sessions_taken ?? '—'}</dd>
      <dt>Dropped out?</dt><dd>{yn(t.dropped_out)}{t.dropped_out ? ` · after ${t.dropout_after ?? '?'} sessions` : ''}</dd>
      {t.dropped_out && <><dt>Drop-out reason</dt><dd>{t.dropout_reason ?? '—'}</dd></>}
      <dt>Overall feedback</dt><dd>{t.overall_feedback ?? '—'}</dd>
      <dt>Private practice?</dt><dd>{yn(t.private_practice)}{t.private_practice && t.private_price ? ` · ${inr(t.private_price)}/session` : ''}</dd>
    </dl>
  )
}

function YN({ name, value }: { name: string; value: boolean | null | undefined }) {
  const v = value === true ? 'yes' : value === false ? 'no' : undefined
  return (
    <div className="yn">
      <label><input type="radio" name={name} value="yes" defaultChecked={v === 'yes'} /> Yes</label>
      <label><input type="radio" name={name} value="no" defaultChecked={v === 'no'} /> No</label>
    </div>
  )
}

/** Trainee's tracking sheet fields (wrapped in an ActionForm by the page). */
export function TrackingFields({ t, completed }: { t: Tracking | null; completed: number }) {
  return (
    <div className="form-grid">
      <div className="field"><span>Took intro call?</span><YN name="intro_call" value={t?.intro_call} /></div>
      <div className="field"><span>Took first session?</span><YN name="first_session" value={t?.first_session} /></div>
      <label className="field full"><span>First session feedback</span><textarea name="first_session_feedback" defaultValue={t?.first_session_feedback ?? ''} /></label>
      <label className="field"><span>How many sessions took?</span><small>{completed} marked completed in the calendar</small><input type="number" min="0" name="sessions_taken" defaultValue={t?.sessions_taken ?? completed} /></label>
      <div className="field"><span>Dropped out (DO)?</span><small>&nbsp;</small><YN name="dropped_out" value={t?.dropped_out} /></div>
      <label className="field"><span>If DO, reason?</span><input name="dropout_reason" defaultValue={t?.dropout_reason ?? ''} /></label>
      <label className="field"><span>…and after how many sessions?</span><input type="number" min="0" name="dropout_after" defaultValue={t?.dropout_after ?? ''} /></label>
      <label className="field full"><span>Overall feedback</span><textarea name="overall_feedback" defaultValue={t?.overall_feedback ?? ''} /></label>
      <div className="field"><span>Shifting to private practice?</span><YN name="private_practice" value={t?.private_practice} /></div>
      <label className="field"><span>If yes, price per session (₹)</span><input type="number" min="0" name="private_price" defaultValue={t?.private_price ?? ''} /></label>
    </div>
  )
}
