import { consentItems, EMERGENCY_HELP } from '@/lib/forms'
import { todayIst } from '@/lib/format'

/** The consent questions for a trainee (onboarding) or a client (consent link). */
export function ConsentFields({ kind }: { kind: 'trainee' | 'client' }) {
  return (
    <div className="stack">
      <input type="hidden" name="consent_date" value={todayIst()} />
      <fieldset className="consent-item emergency">
        <legend>Emergency contact <b className="req">*</b></legend>
        <p className="fine">{EMERGENCY_HELP[kind]}</p>
        <div className="form-grid">
          <label className="field"><span>Their name</span><input name="ec_name" required autoComplete="off" placeholder="e.g. Asha Sharma" /></label>
          <label className="field"><span>Relationship to you</span><input name="ec_relation" required placeholder="e.g. mother, partner, friend" /></label>
          <label className="field"><span>Their phone number</span><input name="ec_phone" type="tel" inputMode="tel" required placeholder="10-digit mobile number" pattern="[+0-9 ()-]{10,16}" /></label>
        </div>
      </fieldset>
      {consentItems(kind).map((item) => (
        <div className="consent-item" key={item.key}>
          <p>{item.label}{item.required && <b className="req"> *</b>}</p>
          <div className="yn" role="radiogroup" aria-label={item.label}>
            <label><input type="radio" name={`c_${item.key}`} value="yes" required /> Yes</label>
            {!item.yesOnly && <label><input type="radio" name={`c_${item.key}`} value="no" required /> No</label>}
          </div>
        </div>
      ))}
      <label className="field consent-item">
        <span>Type your full name as your electronic signature <b className="req">*</b></span>
        <input name="signature" required autoComplete="name" style={{ fontFamily: 'var(--font-display), serif', fontSize: 20 }} />
      </label>
    </div>
  )
}
