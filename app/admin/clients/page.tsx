import Link from 'next/link'
import { loadEverything } from '@/lib/data'
import { AssignForm } from '@/components/AssignForm'
import { Pill } from '@/components/Pill'
import { fmtDate } from '@/lib/format'

const FILTERS = { all: 'All', unassigned: 'Unassigned', active: 'In therapy', flagged: 'Self-harm: yes', dropped: 'Dropped' } as const

export default async function Clients({ searchParams }: { searchParams: Promise<{ filter?: keyof typeof FILTERS; q?: string }> }) {
  const { filter = 'all', q = '' } = await searchParams
  const d = await loadEverything()
  const load = new Map<string, number>()
  d.clients.forEach((c) => c.trainee_id && load.set(c.trainee_id, (load.get(c.trainee_id) ?? 0) + 1))
  const consented = new Set(d.consents.filter((c) => c.kind === 'client').map((c) => c.client_id))
  const done = new Map<string, number>()
  d.sessions.forEach((s) => s.status === 'completed' && done.set(s.client_id, (done.get(s.client_id) ?? 0) + 1))

  const needle = q.trim().toLowerCase()
  const list = d.clients.filter((c) =>
    (filter === 'unassigned' ? !c.trainee_id
      : filter === 'active' ? ['assigned', 'active'].includes(c.status)
      : filter === 'flagged' ? c.self_harm === 'Yes'
      : filter === 'dropped' ? c.status === 'dropped' : true) &&
    (!needle || `${c.full_name} ${c.email} ${c.org} ${c.whatsapp}`.toLowerCase().includes(needle)))

  return (
    <>
      <div className="head">
        <div><h1>Clients</h1><p className="muted">Everyone who signed up on the onboarding page (Aadhaar-verified). New sign-ups land here to be assigned.</p></div>
        <a className="btn ghost" href="/onboarding" target="_blank">Open onboarding page ↗</a>
      </div>
      <div className="row" style={{ marginBottom: 14 }}>
        {Object.entries(FILTERS).map(([k, label]) => (
          <Link key={k} href={`/admin/clients?filter=${k}`} className={`btn small ${filter === k ? '' : 'ghost'}`}>{label}</Link>
        ))}
        <form style={{ marginLeft: 'auto' }}><input type="hidden" name="filter" value={filter} /><input name="q" defaultValue={q} placeholder="Search name, email, org…" /></form>
      </div>
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Client</th><th>Signed up</th><th>Status</th><th>Consent</th><th className="num">Sessions</th><th>Therapist</th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/clients/${c.id}`}>{c.full_name}</Link>
                    {c.self_harm === 'Yes' && <span className="pill berry" style={{ marginLeft: 6 }}>self-harm: yes</span>}
                    <div className="fine">{c.org} · {c.email}</div>
                  </td>
                  <td>{fmtDate(c.created_at)}</td>
                  <td><Pill status={c.status} /></td>
                  <td>{consented.has(c.id) ? <span className="pill sage">signed</span> : <span className="pill">pending</span>}</td>
                  <td className="num">{done.get(c.id) ?? 0}</td>
                  <td><AssignForm clientId={c.id} current={c.trainee_id} trainees={d.trainees} load={load} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && <p className="empty">No clients here.</p>}
        </div>
      </section>
    </>
  )
}
