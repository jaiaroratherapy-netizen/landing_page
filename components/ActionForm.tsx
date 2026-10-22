'use client'

import { useActionState, useEffect, useLayoutEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'

export type ActionResult = { ok?: string; error?: string } | null | void

type Saved = [string, string][]

/** A form bound to a server action that shows the action's success/error message inline.
 *  React clears a form after each submit, so values are put back whenever the action fails;
 *  with `draftKey`, answers are also kept on this device until the form is sent successfully. */
export function ActionForm({
  action, children, className, resetOnSuccess, confirm, draftKey, hideOnSuccess,
}: {
  action: (fd: FormData) => Promise<ActionResult>
  children: React.ReactNode
  className?: string
  resetOnSuccess?: boolean
  confirm?: string
  draftKey?: string
  hideOnSuccess?: boolean
}) {
  const ref = useRef<HTMLFormElement>(null)
  const submitted = useRef<Saved>([])
  const storageKey = draftKey ? `kirana-draft:${draftKey}` : null
  const [state, run] = useActionState<ActionResult, FormData>(async (_, fd) => {
    submitted.current = entries(fd)
    try {
      return await action(fd)
    } catch (e) {
      // a successful action that redirects throws NEXT_REDIRECT: the form is done, so drop the draft
      if (storageKey && String((e as { digest?: string })?.digest ?? '').startsWith('NEXT_REDIRECT')) {
        try { localStorage.removeItem(storageKey) } catch { /* ignore */ }
      }
      throw e
    }
  }, null)

  // restore a saved draft once
  useEffect(() => {
    if (!storageKey || !ref.current) return
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) fill(ref.current, JSON.parse(raw) as Saved)
    } catch { /* storage unavailable */ }
  }, [storageKey])

  // save the draft as people type
  useEffect(() => {
    const form = ref.current
    if (!storageKey || !form) return
    const save = () => { try { localStorage.setItem(storageKey, JSON.stringify(entries(new FormData(form)))) } catch { /* ignore */ } }
    form.addEventListener('input', save)
    form.addEventListener('change', save)
    return () => { form.removeEventListener('input', save); form.removeEventListener('change', save) }
  }, [storageKey])

  // after the action: put values back on error, clear the draft on success
  useLayoutEffect(() => {
    if (!state || !ref.current) return
    if (state.error) fill(ref.current, submitted.current)
    if (state.ok) {
      if (storageKey) try { localStorage.removeItem(storageKey) } catch { /* ignore */ }
      if (resetOnSuccess) ref.current.reset()
    }
  }, [state, storageKey, resetOnSuccess])

  if (hideOnSuccess && state?.ok) return <p className="note ok" role="status">{state.ok}</p>
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

function entries(fd: FormData): Saved {
  return [...fd.entries()].filter((e): e is [string, string] => typeof e[1] === 'string')
}

/** Puts saved values back into a form's fields (skips hidden and file inputs). */
function fill(form: HTMLFormElement, saved: Saved) {
  const byName = new Map<string, string[]>()
  saved.forEach(([k, v]) => byName.set(k, [...(byName.get(k) ?? []), v]))
  for (const el of Array.from(form.elements)) {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) || !el.name) continue
    if (el instanceof HTMLInputElement && (el.type === 'hidden' || el.type === 'file' || el.type === 'submit')) continue
    const values = byName.get(el.name)
    if (el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox')) {
      if (values) el.checked = values.includes(el.value)
      else if (el.type === 'checkbox') el.checked = false
    } else if (values) {
      el.value = values[0]
    }
  }
}

export function Submit({ children, className = 'btn', pendingText = 'Saving…' }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus()
  return <button className={className} disabled={pending}>{pending ? pendingText : children}</button>
}
