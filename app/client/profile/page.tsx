import { requireRole } from '@/lib/auth'
import { db } from '@/lib/supabase'
import { ActionForm, Submit } from '@/components/ActionForm'
import { ConsentView } from '@/components/ConsentView'
import { updateMyClientProfile } from '../actions'
import type { Consent } from '@/lib/types'

export default async function ClientProfile() {
  const me = await requireRole('client')
  const c = me.client
  const { data: consent } = await db().from('consents').select('*').eq('kind', 'client').eq('client_id', c.id).order('signed_at', { ascending: false }).limit(1).maybeSingle<Consent>()
  return (
    <>
      <div className="head"><div><h1>Your profile</h1><p className="muted">{c.email}</p></div></div>
      <div className="grid g2">
        <section className="card">
          <ActionForm action={updateMyClientProfile} className="form-grid">
            <label className="field full"><span>Name <small>(from your verified Aadhaar)</small></span><input value={c.full_name} disabled /></label>
            <label className="field"><span>WhatsApp</span><input name="whatsapp" type="tel" defaultValue={c.whatsapp ?? ''} /></label>
            <label className="field"><span>Pronouns</span><input name="pronouns" defaultValue={c.pronouns ?? ''} /></label>
            <label className="field full"><span>Emergency contact</span><input name="emergency_contact" defaultValue={c.emergency_contact ?? ''} /></label>
            <div className="full"><Submit>Save</Submit></div>
          </ActionForm>
          <p className="fine sp">To change your email, message Kirana Counselling on WhatsApp.</p>
        </section>
        <section className="card">
          <h2>Your consent form</h2>
          <ConsentView consent={consent ?? null} />
          <p className="fine sp">You can withdraw any part of your consent at any time by emailing kirana.counselling@gmail.com.</p>
        </section>
      </div>
    </>
  )
}
