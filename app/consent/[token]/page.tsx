import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/supabase'
import { ConsentFields } from '@/components/ConsentFields'
import { ActionForm, Submit } from '@/components/ActionForm'
import { signClientConsent } from './actions'
import type { Client, Invite, Trainee } from '@/lib/types'

export const metadata: Metadata = { title: 'Consent form', robots: { index: false } }

export default async function ConsentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { data: invite } = await db().from('invites').select('*').eq('token', token).eq('kind', 'client_consent').maybeSingle<Invite>()
  const [{ data: client }, { data: trainee }] = await Promise.all([
    db().from('clients').select('full_name').eq('id', invite?.client_id ?? '00000000-0000-0000-0000-000000000000').maybeSingle<Pick<Client, 'full_name'>>(),
    db().from('trainees').select('full_name').eq('id', invite?.trainee_id ?? '00000000-0000-0000-0000-000000000000').maybeSingle<Pick<Trainee, 'full_name'>>(),
  ])

  const valid = invite && client && !invite.used_at && new Date(invite.expires_at) > new Date()
  return (
    <main className="paper">
      <div className="sheet">
        <header>
          <img src="/kirana-logo.png" alt="Kirana Counselling" />
          <h1>Client consent form</h1>
          {valid && <p className="muted">Hi {client.full_name.split(' ')[0]}! {trainee ? `${trainee.full_name} will be your therapist. ` : ''}Please read each statement and answer Yes or No.</p>}
        </header>
        {!valid ? (
          <div className="stack">
            <p className={invite?.used_at ? 'note ok' : 'note bad'}>
              {invite?.used_at ? 'This consent form has already been signed. Thank you!' : 'This link is not valid or has expired. Please ask your therapist for a new one.'}
            </p>
            <Link className="btn" href="/login">Sign in</Link>
          </div>
        ) : (
          <ActionForm action={signClientConsent.bind(null, token)} className="stack">
            <ConsentFields />
            <Submit pendingText="Submitting…">Sign consent form</Submit>
          </ActionForm>
        )}
      </div>
    </main>
  )
}
