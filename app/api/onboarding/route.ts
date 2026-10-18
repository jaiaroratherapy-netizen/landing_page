import { createHash } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/supabase'
import { AadhaarQR } from '@/lib/aadhaar'
import { logActivity } from '@/lib/auth'

const s = (v: unknown, max = 2000) => String(v ?? '').trim().slice(0, max)
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status })
const norm = (n: string) => n.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim()

// Client sign-up from the onboarding page (therapy.html). The Aadhaar QR is re-verified here, never trusted from the browser.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return fail('Bad request') }

  const email = s(body.email, 200).toLowerCase()
  const whatsapp = s(body.whatsapp, 20).replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').replace(/^0(?=\d{10}$)/, '')
  const selfHarm = s(body.selfHarm, 40)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Please enter a valid email.')
  if (!/^[6-9]\d{9}$/.test(whatsapp)) return fail('Please enter a valid 10-digit WhatsApp number.')
  if (!s(body.reason) || !s(body.diagnosis) || !s(body.org)) return fail('Please fill in all required fields.')
  if (!['Yes', 'No', 'Prefer not to say'].includes(selfHarm)) return fail('Please answer the self-harm question.')
  if (body.agree !== true) return fail('Please accept the agreement.')

  let qr
  try { qr = await AadhaarQR.read(s(body.qr, 9000)) } catch (e) {
    const code = (e as { code?: string }).code
    return fail(code === 'BAD_SIGNATURE' ? 'This Aadhaar QR is not signed by UIDAI.' : 'We could not verify this Aadhaar QR. Please scan it again.')
  }
  if (!qr.name) return fail('We could not read the name on this Aadhaar.')
  const age = AadhaarQR.age(qr.dob)
  if (age !== null && age < 18) return fail('This service is only for people aged 18 and above.')
  const name = s(body.name, 200)
  if (name && norm(name) !== norm(qr.name)) return fail('The name must match your Aadhaar.')

  const idHash = createHash('sha256').update([norm(qr.name), qr.dob, qr.aadhaarLast4, qr.gender].join('|')).digest('hex')
  const { data: existing } = await db().from('clients').select('id, email').or(`email.eq.${email},id_hash.eq.${idHash}`).limit(1)
  if (existing?.length) {
    return fail('You are already registered with us. Sign in at kiranacounselling.com/login with the email you used, or message us on WhatsApp.', 409)
  }

  const year = AadhaarQR.birthYear(qr.dob)
  const { data: row, error } = await db().from('clients').insert({
    email, full_name: qr.name, whatsapp,
    reason: s(body.reason), diagnosis: s(body.diagnosis), self_harm: selfHarm, org: s(body.org, 300), pref: s(body.pref) || null,
    aadhaar_last4: qr.aadhaarLast4, birth_year: year ? Number(year) : null, gender: qr.gender,
    id_hash: idHash, id_verified_by: qr.verifiedBy, mobile_match: await AadhaarQR.matchesMobile(qr, whatsapp),
    qr_generated_at: qr.generatedAt,
  }).select('id').single()
  if (error) {
    if (error.code === '23505') return fail('You are already registered with us.', 409)
    console.error('onboarding insert failed', error)
    return fail('Something went wrong. Please try again.', 500)
  }
  await logActivity(email, 'signed up as a client', 'client', row.id, `${qr.name}${selfHarm === 'Yes' ? ' · flagged self-harm: Yes' : ''}`)
  return NextResponse.json({ ok: true, name: qr.name })
}
