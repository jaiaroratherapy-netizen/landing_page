import { DAYS, slotsText } from '@/lib/profiles'
import type { Trainee } from '@/lib/types'

/** Public-profile inputs (wrapped in an ActionForm by the page). */
export function ProfileFields({ t, admin }: { t: Trainee; admin?: boolean }) {
  return (
    <div className="form-grid">
      {admin && (
        <label className="field"><span>Profile address</span><small>kiranacounselling.com/therapists/…</small><input name="slug" defaultValue={t.slug ?? ''} placeholder="first-last" /></label>
      )}
      <label className="field"><span>Pronouns</span><input name="pronouns" defaultValue={t.pronouns ?? ''} placeholder="she/her" /></label>
      <label className="field"><span>City</span><input name="city" defaultValue={t.city ?? ''} placeholder="Delhi NCR" /></label>
      <label className="field"><span>Languages</span><small>comma separated</small><input name="languages" defaultValue={t.languages ?? ''} placeholder="Hindi, English" /></label>
      <label className="field"><span>Approach / specialisations</span><small>comma separated</small><input name="specialisations" defaultValue={t.specialisations ?? ''} placeholder="Eclectic, Grief, Relationships" /></label>
      <label className="field full"><span>About you</span><small>What clients see first. Who you work with and how.</small><textarea name="bio" rows={6} defaultValue={t.bio ?? ''} /></label>
      <label className="field"><span>Qualifications</span><input name="qualifications" defaultValue={t.qualifications ?? ''} placeholder="MA Clinical Psychology" /></label>
      <label className="field"><span>Experience</span><input name="experience" defaultValue={t.experience ?? ''} /></label>
      <label className="field"><span>Intro call booking link</span><input name="intro_call_url" defaultValue={t.intro_call_url ?? ''} placeholder="https://serene.vybz.health/user/…" /></label>
      <label className="field"><span>LinkedIn</span><input name="linkedin" defaultValue={t.linkedin ?? ''} /></label>
      <fieldset className="field full avail">
        <span>Weekly availability <small>(India time, e.g. 19:00-20:00, 21:00-22:30)</small></span>
        {DAYS.map((d) => (
          <label key={d}><b>{d.slice(0, 3)}</b><input name={`av_${d}`} defaultValue={slotsText(t.availability?.[d])} placeholder="—" /></label>
        ))}
      </fieldset>
      <label className="choice full"><input type="checkbox" name="is_public" defaultChecked={t.is_public} /> Show my profile on kiranacounselling.com/therapists</label>
    </div>
  )
}
