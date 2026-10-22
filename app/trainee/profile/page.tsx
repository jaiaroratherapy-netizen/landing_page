import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/supabase'
import { ActionForm, Submit } from '@/components/ActionForm'
import { ConsentView } from '@/components/ConsentView'
import { PhotoInput } from '@/components/PhotoInput'
import { ProfileFields } from '@/components/ProfileFields'
import { updateMyProfile, updateMyPublicProfile, uploadMyPhoto } from '../actions'
import { CalendarCard } from '@/components/CalendarCard'
import { googleConfigured } from '@/lib/google'
import type { Consent } from '@/lib/types'

export default async function TraineeProfile({ searchParams }: { searchParams: Promise<{ welcome?: string; calendar?: string }> }) {
  const { welcome, calendar } = await searchParams
  const me = await requireRole('trainee')
  const t = me.trainee
  const [{ data: cohort }, { data: consent }, { data: account }] = await Promise.all([
    t.cohort_id ? db().from('cohorts').select('name').eq('id', t.cohort_id).maybeSingle() : Promise.resolve({ data: null }),
    db().from('consents').select('*').eq('kind', 'trainee').eq('trainee_id', t.id).order('signed_at', { ascending: false }).limit(1).maybeSingle<Consent>(),
    db().from('google_accounts').select('google_email, connected_at, last_error').eq('trainee_id', t.id).maybeSingle(),
  ])
  return (
    <>
      <div className="head">
        <div><h1>Your profile</h1><p className="muted">{t.email}{cohort ? ` · ${cohort.name}` : ''}</p></div>
        {t.slug && <Link className="btn ghost" href={`/therapists/${t.slug}`} target="_blank">View my public page ↗</Link>}
      </div>
      {welcome && <p className="note ok" style={{ marginBottom: 16 }}>Welcome aboard! Your onboarding form is saved. Please check your public profile below.</p>}

      <CalendarCard account={account} result={calendar} availability={t.availability} configured={googleConfigured()} />

      <section className="card sp">
        <h2>Public profile</h2>
        <p className="muted" style={{ marginBottom: 16 }}>Clients and visitors see this on kiranacounselling.com/therapists when choosing a therapist and booking an intro call.</p>
        <PhotoInput action={uploadMyPhoto} current={t.photo_url} name={t.full_name} />
        <ActionForm action={updateMyPublicProfile} className="stack sp">
          <ProfileFields t={t} />
          <div><Submit>Save public profile</Submit></div>
        </ActionForm>
      </section>

      <div className="grid g2 sp">
        <section className="card">
          <h2>Private details</h2>
          <p className="fine" style={{ marginBottom: 12 }}>Only the Kirana team sees these.</p>
          <ActionForm action={updateMyProfile} className="form-grid">
            <label className="field"><span>Full name</span><input name="full_name" defaultValue={t.full_name} required /></label>
            <label className="field"><span>WhatsApp</span><input name="phone" defaultValue={t.phone ?? ''} /></label>
            <label className="field"><span>UPI ID <small>(clients pay you here from session 4)</small></span><input name="upi_id" defaultValue={t.upi_id ?? ''} /></label>
            <label className="field"><span>Emergency contact</span><input name="emergency_contact" defaultValue={t.emergency_contact ?? ''} /></label>
            <div className="full"><Submit>Save</Submit></div>
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
