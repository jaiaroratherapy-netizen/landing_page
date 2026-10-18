import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { loadForTrainee } from '@/lib/data'
import { Pill } from '@/components/Pill'
import { fmtDate, fmtDateTime } from '@/lib/format'

export default async function MyClients() {
  const me = await requireRole('trainee')
  const d = await loadForTrainee(me.trainee.id)
  const consented = new Set(d.consents.map((c) => c.client_id))
  const now = Date.now()
  return (
    <>
      <div className="head"><div><h1>My clients</h1><p className="muted">Clients Kirana has assigned to you.</p></div></div>
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Client</th><th>Status</th><th>Consent</th><th className="num">Done</th><th>Next session</th><th>Assigned</th></tr></thead>
            <tbody>
              {d.clients.map((c) => {
                const next = d.sessions.find((s) => s.client_id === c.id && s.status === 'scheduled' && new Date(s.scheduled_at).getTime() > now)
                return (
                  <tr key={c.id}>
                    <td><Link href={`/trainee/clients/${c.id}`}>{c.full_name}</Link>{c.self_harm === 'Yes' && <span className="pill berry" style={{ marginLeft: 6 }}>self-harm: yes</span>}<div className="fine">{c.org}</div></td>
                    <td><Pill status={c.status} /></td>
                    <td>{consented.has(c.id) ? <span className="pill sage">signed</span> : <span className="pill">pending</span>}</td>
                    <td className="num">{d.allSessions.filter((s) => s.client_id === c.id && s.status === 'completed').length}</td>
                    <td>{next ? fmtDateTime(next.scheduled_at) : <span className="muted">—</span>}</td>
                    <td>{fmtDate(c.assigned_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!d.clients.length && <p className="empty">No clients assigned yet. Kirana will assign them soon.</p>}
        </div>
      </section>
    </>
  )
}
