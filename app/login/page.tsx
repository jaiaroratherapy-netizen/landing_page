import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getViewer, homeFor } from '@/lib/auth'
import { signInWithGoogle } from './actions'
import { EmailForm } from './EmailForm'
import { GoogleIcon } from '@/components/GoogleIcon'

export const metadata: Metadata = { title: 'Sign in' }

const ERRORS: Record<string, string> = {
  'not-registered': 'You are signed in, but this email is not registered with Kirana. Sign in with the email you were onboarded with.',
  link: 'That sign-in link has expired or was already used. Please try again.',
  google: 'Google sign-in could not start. Please try again.',
}

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next = '/dashboard', error } = await searchParams
  const viewer = await getViewer()
  if (viewer?.role) redirect(next.startsWith('/') && next !== '/login' ? next : homeFor(viewer.role))

  return (
    <main className="auth">
      <div className="auth-card">
        <img src="/kirana-logo.png" alt="Kirana Counselling" className="auth-logo" />
        <h1>Welcome back</h1>
        <p className="muted">Instructors, trainee therapists and clients all sign in here.</p>
        {error && ERRORS[error] && <p className="note bad">{ERRORS[error]}</p>}
        {viewer && !viewer.role && (
          <form action="/auth/signout" method="post"><button className="link">Signed in as {viewer.email}. Sign out</button></form>
        )}
        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={next} />
          <button className="btn google"><GoogleIcon /> Continue with Google</button>
        </form>
        <div className="or"><span>or</span></div>
        <EmailForm next={next} />
        <p className="fine">
          By signing in you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  )
}
