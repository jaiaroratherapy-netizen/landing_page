import Link from 'next/link'
import { loadEverything } from '@/lib/data'
import { AnswersView } from '@/components/AnswersView'
import { CLIENT_FEEDBACK, TRAINEE_FEEDBACK } from '@/lib/forms'

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = 'clients' } = await searchParams
  const d = await loadEverything()
  const trainees = Object.fromEntries(d.trainees.map((t) => [t.id, t.full_name]))
  const clients = Object.fromEntries(d.clients.map((c) => [c.id, c.full_name]))
  const list = tab === 'trainees' ? d.traineeFeedback : d.clientFeedback
  return (
    <>
      <div className="head">
        <div><h1>Feedback</h1><p className="muted">Client feedback is shared with their therapist. Trainee feedback is only visible to you.</p></div>
        <div className="row">
          <Link className={`btn small ${tab === 'clients' ? '' : 'ghost'}`} href="/admin/feedback?tab=clients">From clients ({d.clientFeedback.length})</Link>
          <Link className={`btn small ${tab === 'trainees' ? '' : 'ghost'}`} href="/admin/feedback?tab=trainees">From trainees ({d.traineeFeedback.length})</Link>
        </div>
      </div>
      <div className="grid g2">
        {list.map((f) => (
          <section className="card" key={f.id}>
            <AnswersView
              questions={tab === 'trainees' ? TRAINEE_FEEDBACK : CLIENT_FEEDBACK}
              answers={f.answers}
              at={f.created_at}
              by={tab === 'trainees' ? trainees[f.trainee_id!] : `${clients[f.client_id!]} about ${trainees[f.trainee_id!] ?? 'their therapist'}`}
            />
          </section>
        ))}
      </div>
      {!list.length && <section className="card"><p className="empty">No feedback yet.</p></section>}
    </>
  )
}
