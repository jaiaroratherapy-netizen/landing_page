import { requireRole } from '@/lib/auth'
import { loadForTrainee } from '@/lib/data'
import { SessionList, BookForm } from '@/components/SessionList'
import { bookSession } from '@/app/actions/sessions'

export default async function TraineeSessions() {
  const me = await requireRole('trainee')
  const d = await loadForTrainee(me.trainee.id)
  const names = Object.fromEntries(d.clients.map((c) => [c.id, c.full_name]))
  const now = Date.now()
  const upcoming = d.sessions.filter((s) => s.status === 'scheduled' && new Date(s.scheduled_at).getTime() > now - 3600_000)
  const overdue = d.sessions.filter((s) => s.status === 'scheduled' && new Date(s.scheduled_at).getTime() <= now - 3600_000)
  const past = d.sessions.filter((s) => s.status !== 'scheduled').reverse()
  const props = { role: 'trainee' as const, names, nameKey: 'client_id' as const, hrefFor: (s: { client_id: string }) => `/trainee/clients/${s.client_id}` }
  return (
    <>
      <div className="head"><div><h1>Sessions</h1><p className="muted">All times are India time. Mark each session completed or no-show after it happens so billing stays right.</p></div></div>
      {overdue.length > 0 && (
        <section className="card" style={{ marginBottom: 16, borderColor: 'var(--gold)' }}>
          <h2>Needs an update</h2>
          <SessionList sessions={overdue} {...props} />
        </section>
      )}
      <section className="card">
        <h2>Upcoming</h2>
        <SessionList sessions={upcoming} {...props} empty="Nothing booked." />
      </section>
      <section className="card sp" id="book">
        <h2>Book a session</h2>
        {d.clients.length ? <BookForm action={bookSession} clients={d.clients} /> : <p className="empty">You need an assigned client first.</p>}
      </section>
      <section className="card sp">
        <h2>Past</h2>
        <SessionList sessions={past} {...props} empty="No past sessions." />
      </section>
    </>
  )
}
