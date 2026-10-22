import Link from 'next/link'
import { getViewer } from '@/lib/auth'

export async function PublicHeader() {
  const viewer = await getViewer()
  return (
    <header className="pub-head">
      <Link href="/" className="pub-brand"><img src="/kirana-logo.png" alt="" /><span>Kirana Counselling</span></Link>
      <nav>
        {viewer?.role !== 'client' && <Link href="/onboarding">Get therapy</Link>}
        {viewer?.role
          ? <Link href="/dashboard" className="btn small">My dashboard</Link>
          : <Link href="/login" className="btn small">Sign in</Link>}
      </nav>
    </header>
  )
}
