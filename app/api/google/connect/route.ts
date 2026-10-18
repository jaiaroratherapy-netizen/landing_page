import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getViewer } from '@/lib/auth'
import { authUrl, googleConfigured } from '@/lib/google'
import { origin } from '@/lib/site'

// Starts the Google Calendar connection for the signed-in trainee.
export async function GET() {
  const base = await origin()
  const viewer = await getViewer()
  if (viewer?.role !== 'trainee') return NextResponse.redirect(`${base}/login?next=/trainee/profile`)
  if (!googleConfigured()) return NextResponse.redirect(`${base}/trainee/profile?calendar=not-configured`)
  const state = randomBytes(18).toString('base64url')
  ;(await cookies()).set('g_state', state, { httpOnly: true, secure: base.startsWith('https'), sameSite: 'lax', maxAge: 600, path: '/api/google' })
  return NextResponse.redirect(authUrl(state, `${base}/api/google/callback`, viewer.email))
}
