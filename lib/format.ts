const TZ = 'Asia/Kolkata'

export function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-IN', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-IN', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}

/** "2026-10-20T18:00" typed in a datetime-local box, read as India time. */
export function istInputToIso(local: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) throw new Error('Pick a date and time')
  return new Date(local + ':00+05:30').toISOString()
}

/** ISO → value for a datetime-local box, in India time. */
export function isoToIstInput(iso: string) {
  const d = new Date(new Date(iso).getTime() + 330 * 60_000)
  return d.toISOString().slice(0, 16)
}

/** Monday of the week (India time) as YYYY-MM-DD, for weekly charts. */
export function weekKey(iso: string) {
  const d = new Date(new Date(iso).getTime() + 330 * 60_000)
  const day = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - day)
  return d.toISOString().slice(0, 10)
}

export function shortDay(ymd: string) {
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', day: 'numeric', month: 'short' }).format(new Date(ymd))
}

export function todayIst() {
  return new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10)
}
