import type { Contract } from '@/lib/contracts'

/** The contract text above a consent form: readable, sectioned, and linkified. */
export function ContractView({ contract }: { contract: Contract }) {
  return (
    <article className="contract" aria-label={contract.title}>
      {contract.intro.map((p, i) => <p key={i} className="lead">{linkify(p)}</p>)}
      {contract.sections.map((s) => (
        <section key={s.title}>
          <h2>{s.title}</h2>
          {s.blocks.map((b, i) =>
            'p' in b ? <p key={i}>{linkify(b.p)}</p>
              : 'ul' in b ? <ul key={i}>{b.ul.map((li, j) => <li key={j}>{linkify(li)}</li>)}</ul>
                : (
                  <div className="table-wrap" key={i}>
                    <table>
                      {b.head && <thead><tr><th>{b.head[0]}</th><th>{b.head[1]}</th></tr></thead>}
                      <tbody>{b.table.map(([k, v]) => <tr key={k}><td><b>{k}</b></td><td>{v}</td></tr>)}</tbody>
                    </table>
                  </div>
                ))}
        </section>
      ))}
    </article>
  )
}

function linkify(text: string) {
  return text.split(/(https?:\/\/[^\s,]+[^\s,.]|kirana\.counselling@gmail\.com)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? <a key={i} href={part} target="_blank" rel="noreferrer">{part.replace(/^https?:\/\//, '')}</a>
      : part === 'kirana.counselling@gmail.com' ? <a key={i} href={`mailto:${part}`}>{part}</a>
        : part)
}
