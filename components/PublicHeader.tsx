import Link from 'next/link'

export function PublicHeader() {
  return (
    <header className="pub-head">
      <Link href="/" className="pub-brand"><img src="/kirana-logo.png" alt="" /><span>Kirana Counselling</span></Link>
      <nav>
        <Link href="/therapists">Therapists</Link>
        <Link href="/onboarding">Get therapy</Link>
        <Link href="/login" className="btn small">Sign in</Link>
      </nav>
    </header>
  )
}
