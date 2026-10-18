import { CONSENT_ITEMS } from '@/lib/forms'
import { fmtDate, fmtDateTime } from '@/lib/format'
import type { Consent } from '@/lib/types'

/** Consent read-out: what they said YES to and NO to, side by side. */
export function ConsentView({ consent }: { consent: Consent | null }) {
  if (!consent) return <p className="empty">No consent form signed yet.</p>
  const yes = CONSENT_ITEMS.filter((i) => consent.answers[i.key] === true)
  const no = CONSENT_ITEMS.filter((i) => consent.answers[i.key] !== true)
  return (
    <div className="stack">
      <div className="yesno">
        <div className="yes">
          <h3>✓ Said YES to ({yes.length})</h3>
          {yes.length ? <ul>{yes.map((i) => <li key={i.key}>{i.label}</li>)}</ul> : <p className="fine">Nothing</p>}
        </div>
        <div className="no">
          <h3>✗ Said NO to ({no.length})</h3>
          {no.length ? <ul>{no.map((i) => <li key={i.key}>{i.label}</li>)}</ul> : <p className="fine">Nothing</p>}
        </div>
      </div>
      <dl className="kv">
        <dt>Date on form</dt><dd>{fmtDate(consent.consent_date)}</dd>
        <dt>Emergency contact</dt><dd>{consent.emergency_contact}</dd>
        <dt>Signed as</dt><dd style={{ fontFamily: 'var(--font-display), serif', fontSize: 18 }}>{consent.signature}</dd>
        <dt>Signed at</dt><dd>{fmtDateTime(consent.signed_at)}</dd>
      </dl>
    </div>
  )
}
