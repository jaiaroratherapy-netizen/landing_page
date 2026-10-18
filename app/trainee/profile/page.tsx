import { requireRole } from '@/lib/auth'
import { db } from '@/lib/supabase'
import { ActionForm, Submit } from '@/components/ActionForm'
import { ConsentView } from '@/components/ConsentView'
import { updateMyProfile } from '../actions'
import type { Consent } from '@/lib/types'

export default async function TraineeProfile({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams
  const me = await requireRole('trainee')
  const t = me.trainee
  const [{ data: cohort }, { data: consent }] = await Promise.all([
    t.cohort_id ? db().from('cohorts').select('name').eq('id', t.cohort_id).maybeSingle() : Promise.resolve({ data: null }),
    db().from('consents').select('*').eq('kind', 'trainee').eq('trainee_id', t.id).order('signed_at', { ascending: false }).limit(1).maybeSingle<Consent>(),
  ])
  return (
    <>
      <div className="head"><div><h1>Your profile</h1><p className="muted">{t.email}{cohort ? ` · ${cohort.name}` : ''}</p></div></div>
      {welcome && <p className="note ok" style={{ marginBottom: 16 }}>Welcome aboard! Your onboarding form is saved. Please complete your profile below.</p>}
      <div className="grid g2">
        <section className="card">
          <ActionForm action={updateMyProfile} className="form-grid">
            <label className="field"><span>Full name</span><input name="full_name" defaultValue={t.full_name} required /></label>
            <label className="field"><span>WhatsApp</span><input name="phone" defaultValue={t.phone ?? ''} /></label>
            <label className="field"><span>Pronouns</span><input name="pronouns" defaultValue={t.pronouns ?? ''} /></label>
            <label className="field"><span>Languages</span><input name="languages" defaultValue={t.languages ?? ''} placeholder="Hindi, English" /></label>
            <label className="field"><span>Qualifications</span><input name="qualifications" defaultValue={t.qualifications ?? ''} /></label>
            <label className="field"><span>UPI ID <small>(for payouts)</small></span><input name="upi_id" defaultValue={t.upi_id ?? ''} /></label>
            <label className="field full"><span>Specialisations</span><input name="specialisations" defaultValue={t.specialisations ?? ''} /></label>
            <label className="field full"><span>Emergency contact</span><input name="emergency_contact" defaultValue={t.emergency_contact ?? ''} /></label>
            <label className="field full"><span>Short bio <small>(clients may see this)</small></span><textarea name="bio" defaultValue={t.bio ?? ''} /></label>
            <div className="full"><Submit>Save profile</Submit></div>
          </ActionForm>
        </section>
        <section className="card">
          <h2>Your onboarding consent</h2>
          <ConsentView consent={consent ?? null} />
          <p className="fine sp">To withdraw any part of your consent, email kirana.counselling@gmail.com.</p>
        </section>
      </div>
    </>
  )
}
