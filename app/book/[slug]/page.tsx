import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getViewer } from '@/lib/auth'
import { db } from '@/lib/supabase'
import { bookingProblem, freeSlots, KINDS, type Kind } from '@/lib/booking'
import { PublicHeader } from '@/components/PublicHeader'
import { Avatar } from '@/components/PhotoInput'
import { SlotPicker } from '@/components/SlotPicker'
import { fmtDateTime } from '@/lib/format'
import { bookSlot } from './actions'
import type { Session, Trainee } from '@/lib/types'

export const metadata: Metadata = { title: 'Book a time', robots: { index: false } }

export default async function Book({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ type?: string; reschedule?: string }> }) {
  const [{ slug }, q] = await Promise.all([params, searchParams])
  const { data: t } = await db().from('trainees').select('*').eq('slug', slug).in('status', ['invited', 'onboarded', 'active']).maybeSingle<Trainee>()
  if (!t) notFound()
  const viewer = await getViewer()
  const first = t.full_name.split(' ')[0]

  let kind: Kind = q.type === 'session' ? 'session' : 'intro'
  let reschedule: Session | null = null
  let problem: string | null = null

  if (viewer?.role === 'client' && viewer.client) {
    if (q.reschedule) {
      const { data } = await db().from('sessions').select('*').eq('id', q.reschedule).maybeSingle<Session>()
      if (data && data.client_id === viewer.client.id && data.trainee_id === t.id && data.status === 'scheduled') { reschedule = data; kind = data.kind }
      else problem = 'This booking can no longer be changed.'
    } else {
      problem = await bookingProblem(viewer.client.id, viewer.client.trainee_id, t, kind)
    }
  }
  const days = viewer?.role === 'client' && !problem ? await freeSlots(t, kind, { ignoreSessionId: reschedule?.id }) : []
  const next = `/book/${slug}?type=${kind}${q.reschedule ? `&reschedule=${q.reschedule}` : ''}`

  return (
    <div className="pub">
      <PublicHeader />
      <main className="pub-main" style={{ maxWidth: 820 }}>
        <Link className="crumb" href={viewer?.role === 'client' ? '/client' : `/therapists/${slug}`}>← Back</Link>
        <section className="card stack">
          <div className="row" style={{ gap: 16 }}>
            <Avatar src={t.photo_url} name={t.full_name} size={72} />
            <div>
              <h1 style={{ fontSize: 26 }}>{reschedule ? 'Reschedule' : KINDS[kind].label} with {first}</h1>
              <p className="muted">{KINDS[kind].minutes} minutes · online · {kind === 'intro' ? 'free' : 'first 3 sessions free, then ₹299'}</p>
              {reschedule && <p className="fine">Currently {fmtDateTime(reschedule.scheduled_at)}</p>}
            </div>
          </div>

          {!viewer ? (
            <div className="stack">
              <p>To book, sign in with the email you used when you signed up for therapy.</p>
              <div className="row">
                <Link className="btn berry" href={`/login?next=${encodeURIComponent(next)}`}>Sign in to book</Link>
                <Link className="btn ghost" href="/onboarding">New here? Sign up first</Link>
              </div>
              <p className="fine">Sign-up takes 3 minutes and includes a quick Aadhaar check, so every client is a verified adult.</p>
            </div>
          ) : viewer.role !== 'client' ? (
            <p className="note">Clients book here. You’re signed in as {viewer.role === 'trainee' ? 'a therapist' : 'an instructor'}, so booking is turned off.</p>
          ) : problem ? (
            <div className="stack"><p className="note warn">{problem}</p><div><Link className="btn ghost" href="/client">Go to my sessions</Link></div></div>
          ) : (
            <SlotPicker
              days={days}
              action={bookSlot}
              hidden={{ slug, kind, ...(reschedule ? { reschedule: reschedule.id } : {}) }}
              cta={reschedule ? 'Move to' : 'Book'}
            />
          )}
        </section>
      </main>
    </div>
  )
}
