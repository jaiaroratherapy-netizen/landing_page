import type { Metadata } from 'next'
import Link from 'next/link'
import { listPublicTrainees } from '@/lib/public-profiles'
import { splitList } from '@/lib/profiles'
import { PublicHeader } from '@/components/PublicHeader'
import { Avatar } from '@/components/PhotoInput'

export const metadata: Metadata = {
  title: 'Our Therapists: Affordable Online Therapy in India',
  description: 'Meet Kirana Counselling’s supervised trainee therapists. First 3 sessions free, then ₹299 per session. Online, in Hindi, English, Marathi and more.',
  alternates: { canonical: 'https://kiranacounselling.com/therapists' },
  openGraph: { images: ['/og/og-therapy.png'] },
}

export default async function Therapists({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams
  const all = await listPublicTrainees()
  const languages = [...new Set(all.flatMap((t) => splitList(t.languages)))].sort()
  const list = lang ? all.filter((t) => splitList(t.languages).includes(lang)) : all

  return (
    <div className="pub">
      <PublicHeader />
      <main className="pub-main">
        <section className="pub-hero">
          <h1>Meet our therapists</h1>
          <p>Supervised trainee therapists from Kirana Counselling’s cohorts. Your first 3 sessions are <b>free</b>, then <b>₹299</b> per session. All sessions are online.</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <Link className="btn berry" href="/onboarding">Sign up for therapy</Link>
          </div>
        </section>

        <nav className="chips" aria-label="Filter by language">
          <Link href="/therapists" className={!lang ? 'on' : undefined}>All ({all.length})</Link>
          {languages.map((l) => <Link key={l} href={`/therapists?lang=${encodeURIComponent(l)}`} className={lang === l ? 'on' : undefined}>{l}</Link>)}
        </nav>

        <div className="t-grid">
          {list.map((t) => (
            <Link key={t.id} href={`/therapists/${t.slug}`} className="t-card">
              <Avatar src={t.photo_url} name={t.full_name} size={88} />
              <h2>{t.full_name}</h2>
              <p className="fine">{[t.pronouns, t.city].filter(Boolean).join(' · ') || 'Online'}</p>
              {t.languages && <p className="t-langs">{splitList(t.languages).join(' · ')}</p>}
              {t.bio && <p className="t-bio">{t.bio}</p>}
              <span className="t-more">View profile →</span>
            </Link>
          ))}
        </div>
        {!list.length && <p className="empty">No therapists listed yet.</p>}
      </main>
    </div>
  )
}
