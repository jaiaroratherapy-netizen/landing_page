import { AvailabilityEditor } from './AvailabilityEditor'
import type { Trainee } from '@/lib/types'

/** Public-profile inputs (wrapped in an ActionForm by the page). */
export function ProfileFields({ t, admin }: { t: Trainee; admin?: boolean }) {
  return (
    <div className="form-grid">
      <label className="switch full">
        <input type="checkbox" name="is_public" defaultChecked={t.is_public} />
        <span className="switch-track" aria-hidden="true" />
        <span><b>Show {admin ? 'this' : 'my'} profile on kiranacounselling.com/therapists</b><small>Clients choose a therapist and book from there. Turn off to hide it.</small></span>
      </label>
      {admin && (
        <label className="field"><span>Profile address</span><small>kiranacounselling.com/therapists/…</small><input name="slug" defaultValue={t.slug ?? ''} placeholder="first-last" /></label>
      )}
      <label className="field"><span>Pronouns</span><input name="pronouns" defaultValue={t.pronouns ?? ''} placeholder="she/her" /></label>
      <label className="field"><span>City</span><input name="city" defaultValue={t.city ?? ''} placeholder="Delhi NCR" /></label>
      <label className="field"><span>Languages</span><small>comma separated</small><input name="languages" defaultValue={t.languages ?? ''} placeholder="Hindi, English" /></label>
      <label className="field"><span>Approach / specialisations</span><small>comma separated</small><input name="specialisations" defaultValue={t.specialisations ?? ''} placeholder="Eclectic, Grief, Relationships" /></label>
      <label className="field full"><span>About {admin ? 'them' : 'you'}</span><small>What clients see first. Who you work with and how.</small><textarea name="bio" rows={6} defaultValue={t.bio ?? ''} /></label>
      <label className="field"><span>Qualifications</span><input name="qualifications" defaultValue={t.qualifications ?? ''} placeholder="MA Clinical Psychology" /></label>
      <label className="field"><span>Experience</span><input name="experience" defaultValue={t.experience ?? ''} /></label>
      <label className="field full"><span>LinkedIn</span><input name="linkedin" defaultValue={t.linkedin ?? ''} /></label>
      <div className="field full">
        <span>Weekly availability</span>
        <small>Clients book intro calls (20 min) and sessions (50 min) only inside these hours. All times are India time.</small>
        <AvailabilityEditor initial={t.availability} />
      </div>
    </div>
  )
}
