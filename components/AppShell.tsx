import Link from 'next/link'
import { NavLinks } from './NavLinks'

export type NavItem = { href: string; label: string; icon: string }

export function AppShell({ title, who, nav, children }: { title: string; who: string; nav: NavItem[]; children: React.ReactNode }) {
  return (
    <div className="shell">
      <aside className="side">
        <Link href="/dashboard" className="brand">
          <img src="/kirana-logo.png" alt="" />
          <span>Kirana<small>{title}</small></span>
        </Link>
        <NavLinks nav={nav} />
        <div className="side-foot">
          <span className="who" title={who}>{who}</span>
          <form action="/auth/signout" method="post"><button className="link">Sign out</button></form>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  )
}
