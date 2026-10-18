import { requireRole } from '@/lib/auth'
import { db } from '@/lib/supabase'
import { ActionForm, Submit } from '@/components/ActionForm'
import { AnswersView, QuestionFields } from '@/components/AnswersView'
import { submitTraineeFeedback } from '../actions'
import { loadForTrainee } from '@/lib/data'
import { TRAINEE_FEEDBACK } from '@/lib/forms'
import { fmtDate, fmtDateTime } from '@/lib/format'
import type { Feedback } from '@/lib/types'

export default async function TraineeFeedback() {
  const me = await requireRole('trainee')
  const [d, mine] = await Promise.all([
    loadForTrainee(me.trainee.id),
    db().from('trainee_feedback').select('*').eq('trainee_id', me.trainee.id).order('created_at', { ascending: false }).then((r) => (r.data ?? []) as Feedback[]),
  ])
  const names = Object.fromEntries(d.clients.map((c) => [c.id, c.full_name]))
  const done = d.sessions.filter((s) => s.status === 'completed').reverse()
  return (
    <>
      <div className="head"><div><h1>Feedback to Kirana</h1><p className="muted">Fill this after your sessions. Only the Kirana instructors can see it.</p></div></div>
      <div className="grid g2">
        <section className="card">
          <h2>New feedback</h2>
          <ActionForm action={submitTraineeFeedback} className="stack" resetOnSuccess>
            <label className="field"><span>Which session is this about?</span>
              <select name="session_id" defaultValue={done[0]?.id ?? ''}>
                <option value="">General / whole programme</option>
                {done.map((s) => <option key={s.id} value={s.id}>{names[s.client_id] ?? 'Client'} · {fmtDateTime(s.scheduled_at)}</option>)}
              </select>
            </label>
            <QuestionFields questions={TRAINEE_FEEDBACK} />
            <Submit pendingText="Sending…">Send feedback</Submit>
          </ActionForm>
        </section>
        <section className="card">
          <h2>What you’ve sent ({mine.length})</h2>
          {mine.length ? <div className="stack">{mine.map((f) => <details className="box" key={f.id}><summary>{fmtDate(f.created_at)}</summary><div className="inner"><AnswersView questions={TRAINEE_FEEDBACK} answers={f.answers} /></div></details>)}</div> : <p className="empty">Nothing yet.</p>}
        </section>
      </div>
    </>
  )
}
