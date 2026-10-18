export function Stat({ n, label, sub, berry }: { n: number | string; label: string; sub?: string; berry?: boolean }) {
  return (
    <div className={`card stat${berry ? ' berry' : ''}`}>
      <span>{label}</span>
      <b>{n}</b>
      {sub && <em>{sub}</em>}
    </div>
  )
}
