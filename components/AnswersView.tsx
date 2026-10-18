import { fmtDateTime } from '@/lib/format'

type Q = readonly { key: string; label: string }[]

export function AnswersView({ questions, answers, at, by }: { questions: Q; answers: Record<string, string>; at?: string; by?: string }) {
  return (
    <div className="stack" style={{ gap: 10 }}>
      {(at || by) && <p className="fine">{by}{by && at ? ' · ' : ''}{at && fmtDateTime(at)}</p>}
      <dl className="qa">
        {questions.filter((q) => answers[q.key]).map((q) => (
          <div key={q.key}><dt>{q.label}</dt><dd>{answers[q.key]}</dd></div>
        ))}
      </dl>
    </div>
  )
}

export function QuestionFields({ questions }: { questions: readonly { key: string; label: string; hint?: string }[] }) {
  return (
    <div className="stack">
      {questions.map((q) => (
        <label className="field" key={q.key}>
          <span>{q.label}</span>
          {q.hint && <small>{q.hint}</small>}
          <textarea name={q.key} />
        </label>
      ))}
    </div>
  )
}
