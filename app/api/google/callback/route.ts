import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { getViewer, logActivity } from '@/lib/auth'
import { exchangeCode, GOOGLE_SCOPES } from '@/lib/google'
import { db } from '@/lib/supabase'
import { origin } from '@/lib/site'

export async function GET(req: NextRequest) {
  const base = await origin()
  const back = (result: string) => NextResponse.redirect(`${base}/trainee/profile?calendar=${result}#calendar`)
  const store = await cookies()
  const state = store.get('g_state')?.value
  store.delete({ name: 'g_state', path: '/api/google' })

  const viewer = await getViewer()
  if (viewer?.role !== 'trainee' || !viewer.trainee) return NextResponse.redirect(`${base}/login`)
  const q = req.nextUrl.searchParams
  if (q.get('error')) return back('denied')
  if (!state || q.get('state') !== state || !q.get('code')) return back('failed')

  try {
    const { refreshToken, scope, email } = await exchangeCode(q.get('code')!, `${base}/api/google/callback`)
    const needed = GOOGLE_SCOPES.filter((s) => s.startsWith('https://'))
    if (!needed.every((s) => scope.includes(s))) return back('missing-scope')
    if (!refreshToken) return back('failed')
    await db().from('google_accounts').upsert({ trainee_id: viewer.trainee.id, google_email: email, refresh_token: refreshToken, scope, connected_at: new Date().toISOString(), last_error: null })
    await logActivity(viewer.email, 'connected Google Calendar', 'trainee', viewer.trainee.id, email ?? undefined)
    return back('connected')
  } catch {
    return back('failed')
  }
}
