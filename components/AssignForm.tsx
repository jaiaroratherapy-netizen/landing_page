'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { assignClient } from '@/app/admin/actions'
import type { ActionResult } from './ActionForm'

export type AssignOption = { id: string; name: string; email: string; cohort: string | null; load: number; invited: boolean }

/** Shows the current therapist; opens a searchable list of trainees to (re)assign the client. */
export function AssignForm({ clientId, clientName, current, trainees }: { clientId: string; clientName: string; current: string | null; trainees: AssignOption[] }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')
  const [result, setResult] = useState<ActionResult>(null)
  const [pending, start] = useTransition()
  const currentName = trainees.find((t) => t.id === current)?.name

  const matches = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
    return trainees
      .filter((t) => words.every((w) => `${t.name} ${t.email} ${t.cohort ?? ''}`.toLowerCase().includes(w)))
      .sort((a, b) => Number(b.id === current) - Number(a.id === current) || a.name.localeCompare(b.name))
  }, [q, trainees, current])

  const open = () => { setQ(''); setResult(null); dialog.current?.showModal(); search.current?.focus() }
  const pick = (traineeId: string) => start(async () => {
    const fd = new FormData()
    fd.set('client_id', clientId)
    fd.set('trainee_id', traineeId)
    const r = await assignClient(fd)
    setResult(r)
    if (r?.ok) dialog.current?.close()
  })

  return (
    <div className="assign">
      <button type="button" className={`btn small ${current ? 'ghost' : ''}`} onClick={open}>
        {currentName ?? 'Assign therapist'} <span aria-hidden="true">▾</span>
      </button>
      {result?.ok && <p className="fine" role="status">{result.ok}</p>}

      <dialog ref={dialog} className="modal" aria-label={`Assign a therapist to ${clientName}`} onClick={(e) => { if (e.target === dialog.current) dialog.current.close() }}>
        <div className="modal-head">
          <div><h2>Assign a therapist</h2><p className="fine">for {clientName}{currentName ? ` · now with ${currentName}` : ''}</p></div>
          <button type="button" className="link" onClick={() => dialog.current?.close()} aria-label="Close">Close</button>
        </div>
        <input
          type="search" value={q} onChange={(e) => setQ(e.target.value)} ref={search} placeholder="Search by name, email or cohort…"
          onKeyDown={(e) => { if (e.key === 'Enter' && matches[0] && matches[0].id !== current) { e.preventDefault(); pick(matches[0].id) } }}
        />
        <ul className="pick-list" aria-busy={pending}>
          {matches.map((t) => (
            <li key={t.id}>
              <button type="button" disabled={pending || t.id === current} onClick={() => pick(t.id)}>
                <span><b>{t.name}</b><span className="fine">{[t.cohort, t.email].filter(Boolean).join(' · ')}</span></span>
                <span className="pick-meta">
                  {t.id === current ? <span className="pill assigned">current</span> : t.invited && <span className="pill invited">not onboarded</span>}
                  <span className="fine">{t.load} {t.load === 1 ? 'client' : 'clients'}</span>
                </span>
              </button>
            </li>
          ))}
          {!matches.length && <li className="empty">No trainee matches “{q}”.</li>}
        </ul>
        {result?.error && <p className="note bad" role="alert">{result.error}</p>}
        <div className="modal-foot">
          {pending ? <span className="fine">Saving…</span> : <span className="fine">Both sides are emailed 5 minutes after the last change.</span>}
          {current && <button type="button" className="link" disabled={pending} onClick={() => pick('')}>Unassign</button>}
        </div>
      </dialog>
    </div>
  )
}
