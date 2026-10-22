'use client'

import { useState } from 'react'
import type { Availability, Slot } from '@/lib/types'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
type Day = (typeof DAYS)[number]

// 6:00 am to midnight in 30-minute steps
const TIMES = Array.from({ length: 37 }, (_, i) => {
  const mins = 6 * 60 + i * 30
  return `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}).map((t) => (t === '00:00' ? '24:00' : t))

function label(t: string) {
  if (t === '24:00') return '12 am (midnight)'
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h >= 12 ? 'pm' : 'am'}`
}

/** Weekly hours picker. Writes hidden av_<day> inputs ("19:00-20:00, 21:00-22:30") for the profile form. */
export function AvailabilityEditor({ initial }: { initial: Availability | null }) {
  const [week, setWeek] = useState<Record<Day, Slot[]>>(() =>
    Object.fromEntries(DAYS.map((d) => [d, initial?.[d] ?? []])) as Record<Day, Slot[]>)

  const set = (day: Day, slots: Slot[]) => setWeek((w) => ({ ...w, [day]: slots }))
  const toggle = (day: Day) => set(day, week[day].length ? [] : [{ start_time: '18:00', end_time: '21:00' }])
  const update = (day: Day, i: number, key: keyof Slot, value: string) =>
    set(day, week[day].map((s, j) => (j === i ? { ...s, [key]: value } : s)))
  const add = (day: Day) => {
    const last = week[day][week[day].length - 1]
    const start = last ? TIMES[Math.min(TIMES.indexOf(last.end_time) + 1, TIMES.length - 2)] : '18:00'
    set(day, [...week[day], { start_time: start, end_time: TIMES[Math.min(TIMES.indexOf(start) + 2, TIMES.length - 1)] }])
  }
  const copyToWeekdays = (day: Day) =>
    setWeek((w) => ({ ...w, ...Object.fromEntries(DAYS.slice(0, 5).map((d) => [d, w[day].map((s) => ({ ...s }))])) }))

  return (
    <div className="avail-editor">
      {DAYS.map((day) => {
        const slots = week[day]
        const bad = slots.some((s) => s.end_time <= s.start_time)
        return (
          <div key={day} className={`av-day${slots.length ? ' on' : ''}`}>
            <input type="hidden" name={`av_${day}`} value={slots.map((s) => `${s.start_time}-${s.end_time}`).join(', ')} />
            <label className="av-toggle">
              <input type="checkbox" checked={slots.length > 0} onChange={() => toggle(day)} />
              <span>{day[0].toUpperCase() + day.slice(1, 3)}</span>
            </label>
            <div className="av-slots">
              {!slots.length && <span className="fine">Not available</span>}
              {slots.map((s, i) => (
                <div key={i} className="av-slot">
                  <select aria-label={`${day} from`} value={s.start_time} onChange={(e) => update(day, i, 'start_time', e.target.value)}>
                    {TIMES.slice(0, -1).map((t) => <option key={t} value={t}>{label(t)}</option>)}
                  </select>
                  <span className="fine">to</span>
                  <select aria-label={`${day} until`} value={s.end_time} onChange={(e) => update(day, i, 'end_time', e.target.value)}>
                    {TIMES.slice(1).map((t) => <option key={t} value={t}>{label(t)}</option>)}
                  </select>
                  <button type="button" className="link" aria-label="Remove these hours" onClick={() => set(day, slots.filter((_, j) => j !== i))}>Remove</button>
                </div>
              ))}
              {bad && <span className="note bad">The end time must be after the start time.</span>}
              {slots.length > 0 && (
                <div className="row" style={{ gap: 12 }}>
                  <button type="button" className="link" onClick={() => add(day)}>+ Add more hours</button>
                  {DAYS.indexOf(day) < 5 && <button type="button" className="link" onClick={() => copyToWeekdays(day)}>Copy to Mon–Fri</button>}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
