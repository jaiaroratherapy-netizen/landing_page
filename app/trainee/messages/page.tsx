import { requireRole } from '@/lib/auth'
import { db } from '@/lib/supabase'
import { clientValues, templatesFor } from '@/lib/template-values'
import { MessageCenter } from '@/components/MessageCenter'
import { RecipientPicker } from '@/components/RecipientPicker'
import type { Client } from '@/lib/types'

export default async function TraineeMessages({ searchParams }: { searchParams: Promise<{ to?: string }> }) {
  const { to } = await searchParams
  const me = await requireRole('trainee')
  const { data } = await db().from('clients').select('*').eq('trainee_id', me.trainee.id).order('assigned_at', { ascending: false })
  const clients = (data ?? []) as Client[]
  const c = clients.find((x) => x.id === to) ?? clients[0]
  const [templates, values] = c ? await Promise.all([templatesFor('trainee', 'client'), clientValues(c)]) : [[], {}]
  return (
    <>
      <div className="head"><div><h1>Messages</h1><p className="muted">Ready-made, personalised WhatsApp messages for your clients. Edit anything before sending.</p></div></div>
      <div className="msg-layout">
        <RecipientPicker people={clients.map((x) => ({ id: x.id, name: x.full_name, sub: x.whatsapp ? `+91 ${x.whatsapp}` : 'no number' }))} selected={c?.id} hrefFor={(id) => `/trainee/messages?to=${id}`} empty="No clients assigned yet." />
        {c && <div key={c.id}><MessageCenter templates={templates} values={values} phone={c.whatsapp} name={c.full_name} /></div>}
      </div>
    </>
  )
}
