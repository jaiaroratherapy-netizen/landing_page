import Link from 'next/link'
import { NavLinks } from './NavLinks'
import { Avatar } from './PhotoInput'

export type NavItem = { href: string; label: string; icon: string }
export type ShellUser = { name: string; email: string; photo: string | null; profileHref?: string }

export function AppShell({ title, user, nav, children }: { title: string; user: ShellUser; nav: NavItem[]; children: React.ReactNode }) {
  const me = (
    <>
      <Avatar src={user.photo} name={user.name} size={38} />
      <span className="me-text"><b>{user.name}</b><small>{user.email}</small></span>
    </>
  )
  return (
    <div className="shell">
      <aside className="side">
        <Link href="/dashboard" className="brand">
          <img src="/kirana-logo.png" alt="" />
          <span>Kirana<small>{title}</small></span>
        </Link>
        <NavLinks nav={nav} />
        <div className="side-foot">
          {user.profileHref ? <Link href={user.profileHref} className="me">{me}</Link> : <div className="me">{me}</div>}
          <form action="/auth/signout" method="post">
            <button className="signout" title="Sign out">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  )
}
