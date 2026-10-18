import { ActionForm, Submit } from './ActionForm'
import { disconnectCalendar } from '@/app/trainee/actions'
import { hasAvailability } from '@/lib/profiles'
import { fmtDate } from '@/lib/format'
import type { Availability } from '@/lib/types'

const RESULTS: Record<string, [string, string]> = {
  connected: ['ok', 'Google Calendar connected. New bookings will appear there with a Meet link.'],
  denied: ['warn', 'You cancelled the Google permission screen. Nothing was connected.'],
  failed: ['bad', 'Connecting failed. Please try again.'],
  'missing-scope': ['bad', 'Please tick both calendar permissions on Google’s screen so bookings can be added.'],
  'not-configured': ['warn', 'Calendar connection isn’t switched on yet. Kirana will let you know.'],
}

type Account = { google_email: string | null; connected_at: string; last_error: string | null } | null

export function CalendarCard({ account, result, availability, configured }: { account: Account; result?: string; availability: Availability | null; configured: boolean }) {
  const r = result ? RESULTS[result] : null
  return (
    <section className="card stack" id="calendar">
      <h2>Bookings & Google Calendar</h2>
      {r && <p className={`note ${r[0]}`}>{r[1]}</p>}
      <p className="muted">Clients book free intro calls (20 min) and sessions (50 min) inside your weekly availability on your profile.</p>
      {!hasAvailability(availability) && <p className="note warn">You haven’t set your weekly availability, so clients can’t book you yet. Add it in your public profile below.</p>}
      {account ? (
        <div className="stack" style={{ gap: 8 }}>
          <p>✓ Connected to <b>{account.google_email ?? 'Google Calendar'}</b> since {fmtDate(account.connected_at)}.</p>
          <ul className="fine" style={{ margin: 0, paddingLeft: 18 }}>
            <li>Times you’re busy in Google Calendar are hidden from clients.</li>
            <li>Each booking is added to your calendar with a Google Meet link, and the client gets an invite email.</li>
          </ul>
          {account.last_error && <p className="note bad">{account.last_error}</p>}
          <div className="row">
            {account.last_error && <a className="btn small" href="/api/google/connect">Reconnect</a>}
            <ActionForm action={disconnectCalendar} confirm="Disconnect Google Calendar? Existing events stay in your calendar.">
              <Submit className="btn small ghost">Disconnect</Submit>
            </ActionForm>
          </div>
        </div>
      ) : (
        <div className="stack" style={{ gap: 8 }}>
          <p>Connect your Google Calendar so bookings land there automatically with a Meet link, and clients can’t book times you’re busy.</p>
          <div><a className={`btn${configured ? '' : ' ghost'}`} href="/api/google/connect">Connect Google Calendar</a></div>
          <p className="fine">Kirana only adds and updates the sessions it books, and checks when you’re busy. It never reads the details of your other events.</p>
        </div>
      )}
    </section>
  )
}
