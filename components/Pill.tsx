const LABELS: Record<string, string> = { no_show: 'no-show' }

export function Pill({ status, children }: { status: string; children?: React.ReactNode }) {
  return <span className={`pill ${status}`}>{children ?? LABELS[status] ?? status}</span>
}
