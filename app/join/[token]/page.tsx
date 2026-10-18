import type { Metadata } from 'next'
import Link from 'next/link'
import { getViewer } from '@/lib/auth'
import { db } from '@/lib/supabase'
import { ConsentFields } from '@/components/ConsentFields'
import { ActionForm, Submit } from '@/components/ActionForm'
import { GoogleIcon } from '@/components/GoogleIcon'
import { signInWithGoogle } from '@/app/login/actions'
import { completeOnboarding } from './actions'
import type { Invite, Trainee } from '@/lib/types'

export const metadata: Metadata = { title: 'Trainee onboarding', robots: { index: false } }

export default async function Join({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { data: invite } = await db().from('invites').select('*').eq('token', token).eq('kind', 'trainee_onboarding').maybeSingle<Invite>()
  const { data: trainee } = invite?.trainee_id
    ? await db().from('trainees').select('*').eq('id', invite.trainee_id).maybeSingle<Trainee>()
    : { data: null }

  if (!invite || !trainee || new Date(invite.expires_at) < new Date()) {
    return <Shell><p className="note bad">This onboarding link is not valid or has expired. Please ask Kirana Counselling for a new one.</p></Shell>
  }
  if (invite.used_at) {
    return <Shell><p className="note ok">You have already completed onboarding.</p><Link className="btn" href="/login">Sign in to your dashboard</Link></Shell>
  }

  const viewer = await getViewer()
  const first = trainee.full_name.split(' ')[0]

  if (!viewer || viewer.email !== trainee.email) {
    return (
      <Shell>
        <h2>Hi {first}, welcome to Kirana 💛</h2>
        <p className="muted">Sign in with your Google account <b>{trainee.email}</b> to fill your onboarding and consent form.</p>
        {viewer && (
          <div className="note warn">
            You are signed in as {viewer.email}, which is not the email Kirana registered for you.{' '}
            <form action="/auth/signout" method="post" style={{ display: 'inline' }}><button className="link">Sign out</button></form>
          </div>
        )}
        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={`/join/${token}`} />
          <button className="btn google"><GoogleIcon /> Continue with Google</button>
        </form>
      </Shell>
    )
  }

  return (
    <main className="paper">
      <div className="sheet">
        <header>
          <img src="/kirana-logo.png" alt="Kirana Counselling" />
          <h1>Trainee onboarding & consent</h1>
          <p className="muted">Hi {first}! Please read each statement and answer Yes or No. Signed in as {viewer.email}.</p>
        </header>
        <ActionForm action={completeOnboarding.bind(null, token)} className="stack">
          <label className="field">
            <span>Your WhatsApp number</span>
            <input name="phone" type="tel" defaultValue={trainee.phone ?? ''} placeholder="98xxxxxx10" />
          </label>
          <ConsentFields />
          <Submit pendingText="Submitting…">Submit & continue</Submit>
        </ActionForm>
      </div>
    </main>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth">
      <div className="auth-card">
        <img src="/kirana-logo.png" alt="Kirana Counselling" className="auth-logo" />
        {children}
      </div>
    </main>
  )
}
