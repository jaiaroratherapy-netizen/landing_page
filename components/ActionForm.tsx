'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'

export type ActionResult = { ok?: string; error?: string } | null | void

/** A form bound to a server action that shows the action's success/error message inline. */
export function ActionForm({
  action, children, className, resetOnSuccess, confirm,
}: {
  action: (fd: FormData) => Promise<ActionResult>
  children: React.ReactNode
  className?: string
  resetOnSuccess?: boolean
  confirm?: string
}) {
  const ref = useRef<HTMLFormElement>(null)
  const [state, run] = useActionState<ActionResult, FormData>(async (_, fd) => action(fd), null)
  useEffect(() => { if (state?.ok && resetOnSuccess) ref.current?.reset() }, [state, resetOnSuccess])
  return (
    <form
      ref={ref}
      action={run}
      className={className}
      onSubmit={confirm ? (e) => { if (!window.confirm(confirm)) e.preventDefault() } : undefined}
    >
      {children}
      {state?.error && <p className="note bad" role="alert">{state.error}</p>}
      {state?.ok && <p className="note ok" role="status">{state.ok}</p>}
    </form>
  )
}

export function Submit({ children, className = 'btn', pendingText = 'Saving…' }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus()
  return <button className={className} disabled={pending}>{pending ? pendingText : children}</button>
}
