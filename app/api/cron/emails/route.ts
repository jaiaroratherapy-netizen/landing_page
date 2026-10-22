import { NextResponse, type NextRequest } from 'next/server'
import { processOutbox } from '@/lib/email'
import '@/lib/notify' // registers the deferred jobs

// Called every minute by Supabase pg_cron (and daily by Vercel Cron as a fallback) to send due emails.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return new NextResponse('Unauthorized', { status: 401 })
  return NextResponse.json(await processOutbox(50))
}
export const POST = GET
