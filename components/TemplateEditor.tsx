'use client'

import { useState, useTransition } from 'react'
import type { ActionResult } from './ActionForm'

type Action = (fd: FormData) => Promise<ActionResult>

/** Edits one WhatsApp template: save new wording for everyone, or go back to the default. */
export function TemplateEditor({ templateKey, body, defaultBody, edited, save, reset }: {
  templateKey: string; body: string; defaultBody: string; edited: boolean; save: Action; reset: Action
}) {
  const [text, setText] = useState(body)
  const [result, setResult] = useState<ActionResult>(null)
  const [pending, start] = useTransition()
  const run = (action: Action, after?: () => void) => start(async () => {
    const fd = new FormData()
    fd.set('key', templateKey)
    fd.set('body', text)
    const r = await action(fd)
    setResult(r)
    if (r?.ok) after?.()
  })
  return (
    <div className="stack">
      <textarea name="body" rows={7} value={text} onChange={(e) => setText(e.target.value)} aria-label="Message wording" />
      <div className="row">
        <button type="button" className="btn small" disabled={pending} onClick={() => run(save)}>{pending ? 'Saving…' : 'Save'}</button>
        {edited
          ? <button type="button" className="link" disabled={pending} onClick={() => { if (window.confirm('Go back to the original wording?')) run(reset, () => setText(defaultBody)) }}>Reset to default</button>
          : <span className="fine">Using the default wording.</span>}
      </div>
      {result?.error && <p className="note bad" role="alert">{result.error}</p>}
      {result?.ok && <p className="note ok" role="status">{result.ok}</p>}
    </div>
  )
}
