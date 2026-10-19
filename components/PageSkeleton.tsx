/** Shown instantly inside the portal while a page's data loads. */
export function PageSkeleton() {
  return (
    <div className="skeleton" aria-busy="true" aria-label="Loading">
      <div className="sk sk-title" />
      <div className="sk sk-line" />
      <div className="grid g4 sp">{[0, 1, 2, 3].map((i) => <div key={i} className="sk sk-stat" />)}</div>
      <div className="sk sk-card sp" />
      <div className="sk sk-card sp" />
    </div>
  )
}
