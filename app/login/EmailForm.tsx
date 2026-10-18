'use client'

import { useActionState } from 'react'
import { signInWithEmail, type EmailState } from './actions'

export function EmailForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<EmailState, FormData>(signInWithEmail, {})
  if (state.ok) return <p className="note ok">Check your inbox: we sent you a sign-in link. It works in this browser.</p>
  return (
    <form action={action} className="stack">
      <input type="hidden" name="next" value={next} />
      <label className="field">
        <span>Email you registered with</span>
        <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
      </label>
      {state.error && <p className="note bad">{state.error}</p>}
      <button className="btn ghost" disabled={pending}>{pending ? 'Sending…' : 'Email me a sign-in link'}</button>
    </form>
  )
}
