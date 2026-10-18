import Link from 'next/link'

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="paper">
      <article className="sheet prose">
        <header>
          <Link href="/"><img src="/kirana-logo.png" alt="Kirana Counselling" /></Link>
          <h1>{title}</h1>
          <p className="muted">Last updated {updated}</p>
        </header>
        {children}
        <p className="fine sp"><Link href="/privacy">Privacy Policy</Link> · <Link href="/terms">Terms of Service</Link> · <Link href="/">kiranacounselling.com</Link></p>
      </article>
    </main>
  )
}
