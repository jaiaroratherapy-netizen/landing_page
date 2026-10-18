import { NextResponse } from 'next/server'
import { authClient } from '@/lib/supabase'
import { origin } from '@/lib/site'

export async function POST() {
  const supabase = await authClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', await origin()), { status: 303 })
}
