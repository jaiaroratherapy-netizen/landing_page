import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/supabase'
import { ActionForm, Submit } from '@/components/ActionForm'
import { QuestionFields } from '@/components/AnswersView'
import { submitClientFeedback } from '../../actions'
import { CLIENT_FEEDBACK } from '@/lib/forms'
import { fmtDateTime } from '@/lib/format'
import type { Session } from '@/lib/types'

export default async function ClientFeedback({ params }: { params: Promise<{ session: string }> }) {
  const { session } = await params
  const me = await requireRole('client')
  const { data: s } = await db().from('sessions').select('*').eq('id', session).maybeSingle<Session>()
  if (!s || s.client_id !== me.client.id) notFound()
  return (
    <>
      <Link className="crumb" href="/client">← My sessions</Link>
      <div className="head"><div><h1>How was your session?</h1><p className="muted">Session on {fmtDateTime(s.scheduled_at)}. Your therapist and the Kirana team will read this.</p></div></div>
      <section className="card" style={{ maxWidth: 720 }}>
        <ActionForm action={submitClientFeedback.bind(null, s.id)} className="stack">
          <QuestionFields questions={CLIENT_FEEDBACK} />
          <Submit pendingText="Sending…">Send feedback</Submit>
        </ActionForm>
      </section>
    </>
  )
}
