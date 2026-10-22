import Link from 'next/link'

export type Recipient = { id: string; name: string; sub?: string | null }

/** Left-hand list of people to message; the selected one is in ?to=. */
export function RecipientPicker({ people, selected, hrefFor, empty }: { people: Recipient[]; selected?: string; hrefFor: (id: string) => string; empty: string }) {
  if (!people.length) return <p className="empty">{empty}</p>
  return (
    <nav className="recipients" aria-label="Choose who to message">
      {people.map((p) => (
        <Link key={p.id} href={hrefFor(p.id)} className={p.id === selected ? 'on' : undefined} scroll={false}>
          <b>{p.name}</b>{p.sub && <small>{p.sub}</small>}
        </Link>
      ))}
    </nav>
  )
}
