import type { Availability, Slot } from './types'

export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

/** "Hindi (IN), English (AI)" → "Hindi, English" */
export function cleanLanguages(list: string[] | string | null | undefined) {
  const items = Array.isArray(list) ? list : String(list ?? '').split(',')
  return [...new Set(items.map((l) => l.replace(/\(.*?\)/g, '').trim()).filter(Boolean))].join(', ')
}

export function splitList(s: string | null | undefined) {
  return String(s ?? '').split(',').map((x) => x.trim()).filter(Boolean)
}

export function slugify(name: string) {
  return name.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-')
}

/** "19:00" → "7 pm", "12:30" → "12:30 pm" */
export function time12(t: string) {
  const [h, m] = t.split(':').map(Number)
  if (h === 24) return '12 am'
  const suffix = h >= 12 ? 'pm' : 'am'
  const hh = h % 12 || 12
  return m ? `${hh}:${String(m).padStart(2, '0')} ${suffix}` : `${hh} ${suffix}`
}

export function slotsText(slots: Slot[] | undefined) {
  return (slots ?? []).map((s) => `${s.start_time}-${s.end_time}`).join(', ')
}

/** Parses "19:00-20:00, 21:00-22:30" typed in the availability editor. */
export function parseSlots(text: string): Slot[] | null {
  const parts = text.split(',').map((p) => p.trim()).filter(Boolean)
  const out: Slot[] = []
  for (const p of parts) {
    const m = /^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/.exec(p)
    if (!m || +m[1] > 23 || +m[3] > 24 || +m[2] > 59 || +m[4] > 59) return null
    const start = `${m[1].padStart(2, '0')}:${m[2]}`, end = `${m[3].padStart(2, '0')}:${m[4]}`
    if (end <= start) return null
    out.push({ start_time: start, end_time: end })
  }
  return out
}

export function hasAvailability(a: Availability | null) {
  return !!a && DAYS.some((d) => a[d]?.length)
}
