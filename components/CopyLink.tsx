'use client'

import { useState } from 'react'

export function CopyLink({ url, whatsapp, message }: { url: string; whatsapp?: string | null; message?: string }) {
  const [copied, setCopied] = useState(false)
  const text = `${message ? message + ' ' : ''}${url}`
  const wa = `https://wa.me/${whatsapp ? '91' + whatsapp.replace(/\D/g, '').slice(-10) : ''}?text=${encodeURIComponent(text)}`
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="copy">
        <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Unique link" />
        <button type="button" className="btn small" onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1600) }}>
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <div className="row">
        <a className="btn small ghost" href={wa} target="_blank" rel="noreferrer">Send on WhatsApp</a>
        <a className="btn small ghost" href={`mailto:?subject=${encodeURIComponent('Kirana Counselling')}&body=${encodeURIComponent(text)}`}>Send by email</a>
      </div>
    </div>
  )
}
