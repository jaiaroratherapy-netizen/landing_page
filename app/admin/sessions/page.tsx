import { loadEverything } from '@/lib/data'
import { SessionList } from '@/components/SessionList'

export default async function Sessions({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const { show = 'upcoming' } = await searchParams
  const d = await loadEverything()
  const names = Object.fromEntries(d.clients.map((c) => [c.id, c.full_name]))
  const trainees = Object.fromEntries(d.trainees.map((t) => [t.id, t.full_name]))
  const now = Date.now()
  const list = (show === 'upcoming'
    ? d.sessions.filter((s) => s.status === 'scheduled' && new Date(s.scheduled_at).getTime() > now - 3600_000)
    : show === 'overdue'
      ? d.sessions.filter((s) => s.status === 'scheduled' && new Date(s.scheduled_at).getTime() <= now - 3600_000)
      : [...d.sessions].reverse())
  return (
    <>
      <div className="head">
        <div><h1>Sessions</h1><p className="muted">All bookings. “Needs update” are past sessions the therapist hasn’t marked yet.</p></div>
        <div className="row">
          {[['upcoming', 'Upcoming'], ['overdue', 'Needs update'], ['all', 'All']].map(([k, l]) => (
            <a key={k} className={`btn small ${show === k ? '' : 'ghost'}`} href={`/admin/sessions?show=${k}`}>{l}</a>
          ))}
        </div>
      </div>
      <section className="card">
        <SessionList
          sessions={list}
          role="admin"
          names={Object.fromEntries(list.map((s) => [s.client_id, `${names[s.client_id]} ↔ ${trainees[s.trainee_id] ?? '?'}`]))}
          nameKey="client_id"
          hrefFor={(s) => `/admin/clients/${s.client_id}`}
        />
      </section>
    </>
  )
}
