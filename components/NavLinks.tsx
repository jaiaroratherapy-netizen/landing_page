'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { NavItem } from './AppShell'

export function NavLinks({ nav }: { nav: NavItem[] }) {
  const path = usePathname()
  const root = nav[0]?.href
  return (
    <nav className="nav">
      {nav.map((item) => {
        const active = item.href === root ? path === root : path.startsWith(item.href)
        return (
          <Link key={item.href} href={item.href} className={active ? 'on' : undefined}>
            <span aria-hidden="true">{item.icon}</span>{item.label}
          </Link>
        )
      })}
    </nav>
  )
}
