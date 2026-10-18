import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { authClient, db } from './supabase'
import type { Client, Trainee } from './types'

export type Role = 'admin' | 'trainee' | 'client'

export type Viewer = {
  userId: string
  email: string
  name: string | null
  role: Role | null
  trainee: Trainee | null
  client: Client | null
}

export function adminEmails() {
  return (process.env.ADMIN_EMAILS || 'kirana.counselling@gmail.com')
    .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
}

/** The signed-in person and their role, or null. Links the auth user to their trainee/client row by email. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await authClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user
  if (!user?.email) return null
  const email = user.email.toLowerCase()
  const name = (user.user_metadata?.full_name as string) || null

  if (adminEmails().includes(email)) {
    return { userId: user.id, email, name, role: 'admin', trainee: null, client: null }
  }

  const [{ data: trainee }, { data: client }] = await Promise.all([
    db().from('trainees').select('*').eq('email', email).maybeSingle<Trainee>(),
    db().from('clients').select('*').eq('email', email).maybeSingle<Client>(),
  ])

  if (trainee) {
    if (!trainee.user_id) await db().from('trainees').update({ user_id: user.id }).eq('id', trainee.id)
    return { userId: user.id, email, name, role: 'trainee', trainee, client: null }
  }
  if (client) {
    if (!client.user_id) await db().from('clients').update({ user_id: user.id }).eq('id', client.id)
    return { userId: user.id, email, name, role: 'client', trainee: null, client }
  }
  return { userId: user.id, email, name, role: null, trainee: null, client: null }
})

export async function requireRole(role: 'admin'): Promise<Viewer>
export async function requireRole(role: 'trainee'): Promise<Viewer & { trainee: Trainee }>
export async function requireRole(role: 'client'): Promise<Viewer & { client: Client }>
export async function requireRole(role: Role) {
  const viewer = await getViewer()
  if (!viewer) redirect('/login')
  if (viewer.role !== role) redirect('/dashboard')
  return viewer
}

export function homeFor(role: Role | null) {
  return role ? `/${role}` : '/login?error=not-registered'
}

export async function logActivity(actor: string, action: string, entity?: string, entityId?: string, detail?: string) {
  await db().from('activity').insert({ actor, action, entity, entity_id: entityId, detail })
}
