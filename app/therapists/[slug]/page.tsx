import type { Metadata } from 'next'
import { Fragment } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicTrainee } from '@/lib/public-profiles'
import { getViewer } from '@/lib/auth'
import { DAYS, hasAvailability, splitList, time12 } from '@/lib/profiles'
import { PublicHeader } from '@/components/PublicHeader'
import { Avatar } from '@/components/PhotoInput'
import { ActionForm, Submit } from '@/components/ActionForm'
import { requestTherapist } from '../actions'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = await getPublicTrainee((await params).slug)
  if (!t) return { title: 'Therapist not found' }
  const description = `${t.full_name} is a trainee therapist at Kirana Counselling${t.languages ? `, offering online therapy in ${splitList(t.languages).join(', ')}` : ''}. First 3 sessions free, then ₹299.`
  return {
    title: `${t.full_name}, Trainee Therapist`,
    description,
    alternates: { canonical: `https://kiranacounselling.com/therapists/${t.slug}` },
    openGraph: { title: `${t.full_name} · Kirana Counselling`, description, images: t.photo_url ? [t.photo_url] : ['/og/og-therapy.png'], type: 'profile' },
  }
}

export default async function TherapistProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [t, viewer] = await Promise.all([getPublicTrainee(slug), getViewer()])
  if (!t) notFound()
  const first = t.full_name.split(' ')[0]
  const client = viewer?.role === 'client' ? viewer.client : null
  const mine = client?.trainee_id === t.id
  const ld = {
    '@context': 'https://schema.org', '@type': 'Person', name: t.full_name, jobTitle: 'Trainee Therapist',
    image: t.photo_url ?? undefined, knowsLanguage: splitList(t.languages), knowsAbout: splitList(t.specialisations),
    worksFor: { '@type': 'Organization', name: 'Kirana Counselling', url: 'https://kiranacounselling.com' },
    url: `https://kiranacounselling.com/therapists/${t.slug}`, sameAs: t.linkedin ? [t.linkedin] : undefined,
  }

  return (
    <div className="pub">
      <PublicHeader />
      <main className="pub-main profile">
        <Link className="crumb" href="/therapists">← All therapists</Link>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />

        <section className="p-top card">
          <Avatar src={t.photo_url} name={t.full_name} size={150} />
          <div className="stack" style={{ gap: 8 }}>
            <h1>{t.full_name}</h1>
            <p className="muted">Trainee therapist · Kirana Counselling{t.pronouns ? ` · ${t.pronouns}` : ''}{t.city ? ` · ${t.city}` : ''}</p>
            {t.languages && <div className="tags">{splitList(t.languages).map((l) => <span key={l} className="pill">{l}</span>)}</div>}
            {t.specialisations && <div className="tags">{splitList(t.specialisations).map((l) => <span key={l} className="pill sage">{l}</span>)}</div>}
            <div className="row sp">
              {mine ? (
                <Link className="btn berry" href="/client">Book a session</Link>
              ) : t.intro_call_url ? (
                <a className="btn berry" href={t.intro_call_url} target="_blank" rel="noreferrer">Book a free intro call</a>
              ) : null}
              {!viewer && <Link className="btn ghost" href="/onboarding">New here? Sign up</Link>}
              {t.linkedin && <a className="btn ghost" href={t.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
            </div>
            {mine && <p className="note ok">{first} is your therapist.</p>}
            {client && !client.trainee_id && (
              <ActionForm action={requestTherapist}>
                <input type="hidden" name="trainee_id" value={t.id} />
                <Submit className="btn ghost small" pendingText="Sending…">I’d like to work with {first}</Submit>
              </ActionForm>
            )}
          </div>
        </section>

        <div className="grid g2 sp">
          <section className="card">
            <h2>About {first}</h2>
            {t.bio ? <p style={{ whiteSpace: 'pre-wrap' }}>{t.bio}</p> : <p className="muted">{first} hasn’t written an introduction yet.</p>}
            {(t.qualifications || t.experience) && (
              <dl className="kv sp">
                {t.qualifications && <><dt>Qualifications</dt><dd>{t.qualifications}</dd></>}
                {t.experience && <><dt>Experience</dt><dd>{t.experience}</dd></>}
              </dl>
            )}
          </section>
          <div className="stack">
            <section className="card">
              <h2>Usually available</h2>
              {hasAvailability(t.availability) ? (
                <dl className="kv">
                  {DAYS.filter((d) => t.availability?.[d]?.length).map((d) => (
                    <Fragment key={d}><dt style={{ textTransform: 'capitalize' }}>{d}</dt><dd>{t.availability![d]!.map((s) => `${time12(s.start_time)} – ${time12(s.end_time)}`).join(', ')}</dd></Fragment>
                  ))}
                </dl>
              ) : <p className="muted">Times are agreed after the intro call.</p>}
              <p className="fine sp">India time. Sessions are online.</p>
            </section>
            <section className="card">
              <h2>Fees</h2>
              <ul className="fees">
                <li><b>Intro call</b><span>Free</span></li>
                <li><b>Sessions 1–3</b><span>Free</span></li>
                <li><b>Session 4 onward</b><span>₹299</span></li>
              </ul>
              <p className="fine sp">Offered September–November 2026 under clinical supervision.</p>
            </section>
          </div>
        </div>
        <p className="fine sp">In a crisis, call Tele-MANAS on 14416 (free, 24×7) or 112.</p>
      </main>
    </div>
  )
}
