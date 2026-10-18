import Link from 'next/link'
import { loadEverything } from '@/lib/data'
import { ActionForm, Submit } from '@/components/ActionForm'
import { deleteCohort, saveCohort } from '../actions'
import { fmtDate } from '@/lib/format'

export default async function Cohorts() {
  const d = await loadEverything()
  return (
    <>
      <div className="head"><div><h1>Cohorts</h1><p className="muted">Group trainees into batches. Assign a trainee’s cohort from their profile or when inviting.</p></div></div>
      <div className="grid g3">
        {d.cohorts.map((c) => {
          const ts = d.trainees.filter((t) => t.cohort_id === c.id)
          return (
            <section className="card" key={c.id}>
              <div className="card-head"><h2>{c.name}</h2><Link className="fine" href={`/admin/trainees?cohort=${c.id}`}>{ts.length} trainees →</Link></div>
              <p className="fine">{c.starts_on ? fmtDate(c.starts_on) : '?'} – {c.ends_on ? fmtDate(c.ends_on) : '?'}</p>
              <details className="box sp">
                <summary>Edit</summary>
                <div className="inner">
                  <ActionForm action={saveCohort} className="stack">
                    <input type="hidden" name="id" value={c.id} />
                    <CohortFields c={c} />
                    <Submit className="btn small">Save</Submit>
                  </ActionForm>
                  <ActionForm action={deleteCohort} className="sp" confirm="Delete this cohort?">
                    <input type="hidden" name="id" value={c.id} />
                    <Submit className="link">Delete cohort</Submit>
                  </ActionForm>
                </div>
              </details>
            </section>
          )
        })}
        <section className="card">
          <h2>New cohort</h2>
          <ActionForm action={saveCohort} className="stack" resetOnSuccess>
            <CohortFields />
            <Submit>Create cohort</Submit>
          </ActionForm>
        </section>
      </div>
    </>
  )
}

function CohortFields({ c }: { c?: { name: string; starts_on: string | null; ends_on: string | null; notes: string | null } }) {
  return (
    <>
      <label className="field"><span>Name</span><input name="name" defaultValue={c?.name} placeholder="e.g. Sept 2026 Micro-Skills" required /></label>
      <div className="form-grid">
        <label className="field"><span>Starts</span><input type="date" name="starts_on" defaultValue={c?.starts_on ?? ''} /></label>
        <label className="field"><span>Ends</span><input type="date" name="ends_on" defaultValue={c?.ends_on ?? ''} /></label>
      </div>
      <label className="field"><span>Notes</span><textarea name="notes" defaultValue={c?.notes ?? ''} /></label>
    </>
  )
}
