'use client'

import { useState } from 'react'
import { missing, render, type Template } from '@/lib/templates'

type Values = Record<string, string | null | undefined>

/** Personalised WhatsApp messages for one recipient: edit, copy, or open in WhatsApp. */
export function MessageCenter({ templates, values, phone, name }: { templates: Template[]; values: Values; phone: string | null; name: string }) {
  const digits = (phone ?? '').replace(/\D/g, '').slice(-10)
  return (
    <div className="msg-grid">
      {templates.map((t) => <MessageCard key={t.key} t={t} values={values} digits={digits} name={name} />)}
    </div>
  )
}

function MessageCard({ t, values, digits, name }: { t: Template; values: Values; digits: string; name: string }) {
  const [text, setText] = useState(() => render(t.body, values))
  const [copied, setCopied] = useState(false)
  const gaps = missing(t.body, values)
  const wa = `https://wa.me/${digits ? '91' + digits : ''}?text=${encodeURIComponent(text)}`
  return (
    <section className="card msg">
      <div className="card-head" style={{ marginBottom: 6 }}>
        <h3>{t.title}</h3>
        <span className="fine">{t.when}</span>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={Math.min(9, text.split('\n').length + 2)} aria-label={`${t.title} message`} />
      {gaps.length > 0 && <p className="note warn">Missing: {gaps.join(', ').replace(/_/g, ' ')}. Fill it in above before sending.</p>}
      <div className="row">
        <a className="btn small wa" href={wa} target="_blank" rel="noreferrer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.4 14.1c-.2.6-1.3 1.2-1.8 1.3-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1.1-1.4-1.1-2.7s.7-1.9.9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.1.1.3 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1.9 2 1.2 2.3 1.4.3.1.5.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.8.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3Z" /></svg>
          {digits ? `Send to ${name.split(' ')[0]} on WhatsApp` : 'Open in WhatsApp'}
        </a>
        <button type="button" className="btn small ghost" onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>{copied ? 'Copied ✓' : 'Copy'}</button>
        <button type="button" className="link" onClick={() => setText(render(t.body, values))}>Reset</button>
      </div>
      {!digits && <p className="fine">No WhatsApp number on file, so WhatsApp will ask you to pick the chat.</p>}
    </section>
  )
}
