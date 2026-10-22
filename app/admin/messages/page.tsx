import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/supabase'
import { clientValues, templatesFor, traineeValues } from '@/lib/template-values'
import { MessageCenter } from '@/components/MessageCenter'
import { RecipientPicker } from '@/components/RecipientPicker'
import type { Client, Trainee } from '@/lib/types'

export default async function AdminMessages({ searchParams }: { searchParams: Promise<{ tab?: string; to?: string }> }) {
  const { tab = 'trainees', to } = await searchParams
  await requireRole('admin')
  const isTrainees = tab !== 'clients'
  const { data } = isTrainees
    ? await db().from('trainees').select('*').order('full_name')
    : await db().from('clients').select('*').order('created_at', { ascending: false })
  const people = (data ?? []) as (Trainee | Client)[]
  const sel = people.find((x) => x.id === to) ?? people[0]
  const [templates, values] = sel
    ? await Promise.all([templatesFor('admin', isTrainees ? 'trainee' : 'client'), isTrainees ? traineeValues(sel as Trainee) : clientValues(sel as Client)])
    : [[], {}]
  const phone = sel ? (isTrainees ? (sel as Trainee).phone : (sel as Client).whatsapp) : null
  return (
    <>
      <div className="head">
        <div><h1>Messages</h1><p className="muted">Personalised WhatsApp messages. Edit before sending, or change the default wording for everyone.</p></div>
        <div className="toolbar">
          <Link className={`btn small ${isTrainees ? '' : 'ghost'}`} href="/admin/messages?tab=trainees">Trainees</Link>
          <Link className={`btn small ${isTrainees ? 'ghost' : ''}`} href="/admin/messages?tab=clients">Clients</Link>
          <Link className="btn small ghost" href="/admin/templates">Edit templates</Link>
        </div>
      </div>
      <div className="msg-layout">
        <RecipientPicker
          people={people.map((x) => ({ id: x.id, name: x.full_name, sub: isTrainees ? (x as Trainee).status : (x as Client).status }))}
          selected={sel?.id}
          hrefFor={(id) => `/admin/messages?tab=${isTrainees ? 'trainees' : 'clients'}&to=${id}`}
          empty="Nobody here yet."
        />
        {sel && <div key={sel.id}><MessageCenter templates={templates} values={values} phone={phone} name={sel.full_name} /></div>}
      </div>
    </>
  )
}
