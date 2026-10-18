import { NextResponse } from 'next/server'
import { getViewer } from '@/lib/auth'
import { db } from '@/lib/supabase'
import { KINDS } from '@/lib/kinds'
import type { Session } from '@/lib/types'

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const esc = (s: string) => s.replace(/[\\,;]/g, (m) => '\\' + m).replace(/\n/g, '\\n')

// "Add to calendar" for anyone in the session (works without Google Calendar).
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const viewer = await getViewer()
  const { data: s } = await db().from('sessions').select('*').eq('id', id).maybeSingle<Session>()
  const allowed = s && viewer && (viewer.role === 'admin' || viewer.trainee?.id === s.trainee_id || viewer.client?.id === s.client_id)
  if (!s || !allowed) return new NextResponse('Not found', { status: 404 })
  const [{ data: t }, { data: c }] = await Promise.all([
    db().from('trainees').select('full_name').eq('id', s.trainee_id).single(),
    db().from('clients').select('full_name').eq('id', s.client_id).single(),
  ])
  const other = viewer!.role === 'client' ? t?.full_name : c?.full_name
  const start = new Date(s.scheduled_at)
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kirana Counselling//Booking//EN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', `UID:${s.id}@kiranacounselling.com`, `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`, `DTEND:${stamp(new Date(start.getTime() + s.duration_min * 60_000))}`,
    `SUMMARY:${esc(`Kirana · ${KINDS[s.kind].label}${other ? ` with ${other}` : ''}`)}`,
    s.meeting_link ? `LOCATION:${esc(s.meeting_link)}` : '',
    `DESCRIPTION:${esc(`${s.meeting_link ? `Join: ${s.meeting_link}\n` : ''}Manage at https://kiranacounselling.com/login`)}`,
    s.status === 'cancelled' ? 'STATUS:CANCELLED' : 'STATUS:CONFIRMED',
    'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:Session in 30 minutes', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
  return new NextResponse(ics, { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': `attachment; filename="kirana-${s.kind}.ics"` } })
}
