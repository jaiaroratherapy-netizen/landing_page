import { Fragment } from 'react'
import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/supabase'
import { TemplateEditor } from '@/components/TemplateEditor'
import { PLACEHOLDER_HELP, TEMPLATES } from '@/lib/templates'
import { resetTemplate, saveTemplate } from '../actions'

const GROUPS = [
  { title: 'Trainee → client', match: (t: (typeof TEMPLATES)[number]) => t.from === 'trainee' },
  { title: 'Kirana → client', match: (t: (typeof TEMPLATES)[number]) => t.from === 'admin' && t.audience === 'client' },
  { title: 'Kirana → trainee', match: (t: (typeof TEMPLATES)[number]) => t.from === 'admin' && t.audience === 'trainee' },
]

export default async function Templates() {
  await requireRole('admin')
  const { data } = await db().from('message_templates').select('key, body, updated_by, updated_at')
  const custom = new Map((data ?? []).map((r) => [r.key as string, r]))
  return (
    <>
      <Link className="crumb" href="/admin/messages">← Messages</Link>
      <div className="head"><div><h1>WhatsApp templates</h1><p className="muted">The default wording everyone starts from. Words in {'{curly braces}'} are filled in per person.</p></div></div>
      <details className="box" style={{ marginBottom: 16 }}>
        <summary>Available placeholders</summary>
        <div className="inner"><dl className="kv">{Object.entries(PLACEHOLDER_HELP).map(([k, v]) => <Fragment key={k}><dt><code>{`{${k}}`}</code></dt><dd style={{ fontWeight: 400 }}>{v}</dd></Fragment>)}</dl></div>
      </details>
      {GROUPS.map((g) => (
        <section key={g.title} className="stack" style={{ marginBottom: 22 }}>
          <h2>{g.title}</h2>
          <div className="grid g2">
            {TEMPLATES.filter(g.match).map((t) => {
              const c = custom.get(t.key)
              return (
                <section className="card" key={t.key}>
                  <div className="card-head" style={{ marginBottom: 8 }}><h3>{t.title}</h3>{c && <span className="pill sage">edited</span>}</div>
                  <p className="fine" style={{ marginBottom: 8 }}>{t.when}</p>
                  <TemplateEditor templateKey={t.key} body={c?.body ?? t.body} defaultBody={t.body} edited={!!c} save={saveTemplate} reset={resetTemplate} />
                </section>
              )
            })}
          </div>
        </section>
      ))}
    </>
  )
}
