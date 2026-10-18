import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="auth">
      <div className="auth-card">
        <h1>Page not found</h1>
        <p className="muted">This page wandered off the notebook.</p>
        <Link className="btn" href="/">Back to Kirana Counselling</Link>
      </div>
    </main>
  )
}
