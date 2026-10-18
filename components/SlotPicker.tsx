'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import type { DaySlots } from '@/lib/booking'

const day = new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' })
const time = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' })
const full = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })

export function SlotPicker({ days, action, hidden, cta }: {
  days: DaySlots[]
  action: (prev: { error?: string } | null, fd: FormData) => Promise<{ error?: string } | null>
  hidden: Record<string, string>
  cta: string
}) {
  const [dayIdx, setDayIdx] = useState(0)
  const [start, setStart] = useState<string | null>(null)
  const [state, run] = useActionState(action, null)
  if (!days.length) return <p className="empty">No free times in the next 3 weeks. Please check back soon or message us on WhatsApp.</p>
  const current = days[dayIdx]
  return (
    <form action={run} className="stack">
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <input type="hidden" name="start" value={start ?? ''} />
      <div className="day-strip" role="tablist" aria-label="Choose a day">
        {days.map((d, i) => (
          <button key={d.date} type="button" role="tab" aria-selected={i === dayIdx} className={i === dayIdx ? 'on' : undefined} onClick={() => { setDayIdx(i); setStart(null) }}>
            {day.format(new Date(d.date)).replace(',', '')}<small>{d.slots.length} free</small>
          </button>
        ))}
      </div>
      <div className="time-grid" role="listbox" aria-label="Choose a time">
        {current.slots.map((s) => (
          <button key={s.start} type="button" role="option" aria-selected={start === s.start} className={start === s.start ? 'on' : undefined} onClick={() => setStart(s.start)}>
            {time.format(new Date(s.start))}
          </button>
        ))}
      </div>
      <p className="fine">Times are in India time (IST).</p>
      {state?.error && <p className="note bad" role="alert">{state.error}</p>}
      <Confirm disabled={!start} label={start ? `${cta}: ${full.format(new Date(start))}` : 'Pick a time'} />
    </form>
  )
}

function Confirm({ disabled, label }: { disabled: boolean; label: string }) {
  const { pending } = useFormStatus()
  return <button className="btn berry" disabled={disabled || pending}>{pending ? 'Booking…' : label}</button>
}
