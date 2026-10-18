import { CONSENT_ITEMS } from '@/lib/forms'
import { todayIst } from '@/lib/format'

/** The shared consent form body (used for trainee onboarding and client consent). */
export function ConsentFields() {
  return (
    <div className="stack">
      <div className="form-grid">
        <label className="field">
          <span>Date</span>
          <input type="date" name="consent_date" defaultValue={todayIst()} required />
        </label>
        <label className="field">
          <span>Emergency contact</span>
          <small>Please share your emergency contact and mention the name as well.</small>
          <input name="emergency_contact" required placeholder="e.g. Asha Sharma (mother), 98xxxxxx10" />
        </label>
      </div>
      {CONSENT_ITEMS.map((item) => (
        <div className="consent-item" key={item.key}>
          <p>{item.label}{'required' in item && item.required && <b style={{ color: 'var(--berry)' }}> *</b>}</p>
          <div className="yn" role="radiogroup" aria-label={item.label}>
            <label><input type="radio" name={`c_${item.key}`} value="yes" required /> Yes</label>
            <label><input type="radio" name={`c_${item.key}`} value="no" required /> No</label>
          </div>
        </div>
      ))}
      <label className="field consent-item">
        <span>Type your full name as your electronic signature</span>
        <input name="signature" required autoComplete="name" style={{ fontFamily: 'var(--font-display), serif', fontSize: 20 }} />
      </label>
    </div>
  )
}
