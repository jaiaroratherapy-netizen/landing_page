import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { Avatar } from '@/components/PhotoInput'
import { db } from '@/lib/supabase'
import { billSessions, inr } from '@/lib/money'
import { SessionList, BookForm } from '@/components/SessionList'
import { Stat } from '@/components/Stat'
import { bookSession } from '@/app/actions/sessions'
import { FREE_SESSIONS, SESSION_FEE } from '@/lib/forms'
import type { Session, Trainee } from '@/lib/types'

export default async function ClientHome({ searchParams }: { searchParams: Promise<{ thanks?: string }> }) {
  const { thanks } = await searchParams
  const me = await requireRole('client')
  const c = me.client
  const [{ data: rows }, { data: trainee }, { data: fb }] = await Promise.all([
    db().from('sessions').select('*').eq('client_id', c.id).order('scheduled_at'),
    c.trainee_id ? db().from('trainees').select('full_name, pronouns, languages, bio, qualifications, photo_url, slug, intro_call_url, is_public').eq('id', c.trainee_id).maybeSingle<Partial<Trainee>>() : Promise.resolve({ data: null }),
    db().from('client_feedback').select('session_id').eq('client_id', c.id),
  ])
  // clients never see the therapist's private notes
  const sessions = billSessions(((rows ?? []) as Session[]).map((s) => ({ ...s, trainee_notes: null })))
  const now = Date.now()
  const upcoming = sessions.filter((s) => s.status === 'scheduled' && new Date(s.scheduled_at).getTime() > now - 3600_000)
  const past = sessions.filter((s) => !upcoming.includes(s)).reverse()
  const done = sessions.filter((s) => s.status === 'completed').length
  const given = new Set((fb ?? []).map((f) => f.session_id as string))
  const awaiting = past.filter((s) => s.status === 'completed' && !given.has(s.id))
  const freeLeft = Math.max(0, FREE_SESSIONS - done)

  return (
    <>
      <div className="head"><div><h1>Hi {c.full_name.split(' ')[0]} 💛</h1><p className="muted">Your sessions with Kirana Counselling.</p></div></div>
      {thanks && <p className="note ok" style={{ marginBottom: 16 }}>Thank you for your feedback! It helps your therapist grow.</p>}
      {awaiting.length > 0 && !thanks && <p className="note warn" style={{ marginBottom: 16 }}>You have {awaiting.length} session{awaiting.length > 1 ? 's' : ''} waiting for your feedback below.</p>}

      <div className="grid g3">
        <Stat n={upcoming.length} label="Upcoming sessions" />
        <Stat n={done} label="Sessions completed" />
        <Stat n={freeLeft ? `${freeLeft} free` : inr(SESSION_FEE)} label={freeLeft ? 'Free sessions left' : 'Per session from now'} sub={freeLeft ? `then ${inr(SESSION_FEE)} per session` : undefined} />
      </div>

      <div className="grid g2 sp">
        <section className="card span2">
          <h2>Upcoming</h2>
          <SessionList sessions={upcoming} role="client" empty={trainee ? 'Nothing booked yet. Book a time below or message your therapist.' : 'We are matching you with a therapist. You’ll hear from us on WhatsApp soon.'} />
          {!trainee && <p className="sp"><Link className="btn ghost small" href="/therapists">Browse our therapists</Link> <span className="fine">and tell us who you’d like to work with.</span></p>}
        </section>
        {trainee && (
          <section className="card">
            <h2>Your therapist</h2>
            <div className="row" style={{ gap: 14, marginBottom: 14 }}>
              <Avatar src={trainee.photo_url ?? null} name={trainee.full_name ?? ''} size={72} />
              <div className="stack" style={{ gap: 6 }}>
                <b style={{ fontSize: 18 }}>{trainee.full_name}</b>
                <div className="row">
                  {trainee.slug && trainee.is_public && <Link className="btn small ghost" href={`/therapists/${trainee.slug}`}>View profile</Link>}
                  {trainee.intro_call_url && done === 0 && <a className="btn small" href={trainee.intro_call_url} target="_blank" rel="noreferrer">Book intro call</a>}
                </div>
              </div>
            </div>
            <dl className="kv">
              {trainee.pronouns && <><dt>Pronouns</dt><dd>{trainee.pronouns}</dd></>}
              {trainee.languages && <><dt>Languages</dt><dd>{trainee.languages}</dd></>}
              {trainee.qualifications && <><dt>Qualifications</dt><dd>{trainee.qualifications}</dd></>}
            </dl>
            {trainee.bio && <p className="sp muted" style={{ whiteSpace: 'pre-wrap' }}>{trainee.bio}</p>}
          </section>
        )}
        {trainee && (
          <section className="card">
            <h2>Book a session</h2>
            <BookForm action={bookSession} />
            <p className="fine sp">Your therapist will add the meeting link. Need to change a time? Use “Manage” on the session.</p>
          </section>
        )}
        <section className="card span2">
          <h2>Past sessions</h2>
          <SessionList sessions={past} role="client" feedbackGiven={given} empty="No past sessions yet." />
        </section>
      </div>
      <p className="fine sp">In a crisis, call Tele-MANAS on 14416 (free, 24×7) or 112.</p>
    </>
  )
}
