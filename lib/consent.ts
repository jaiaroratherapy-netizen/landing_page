import 'server-only'
import { randomBytes } from 'node:crypto'
import { headers } from 'next/headers'
import { CONSENT_ITEMS } from './forms'

export function newToken() {
  return randomBytes(24).toString('base64url')
}

export type ParsedConsent = {
  consent_date: string; emergency_contact: string; answers: Record<string, boolean>; signature: string
  user_agent: string | null; ip: string | null
}

export async function parseConsent(fd: FormData): Promise<{ error: string } | { value: ParsedConsent }> {
  const consent_date = String(fd.get('consent_date') || '')
  const emergency_contact = String(fd.get('emergency_contact') || '').trim()
  const signature = String(fd.get('signature') || '').trim().replace(/\s+/g, ' ')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(consent_date)) return { error: 'Please fill in the date.' }
  if (emergency_contact.length < 5) return { error: 'Please share an emergency contact with their name.' }
  if (signature.length < 3) return { error: 'Please type your full name as your signature.' }

  const answers: Record<string, boolean> = {}
  for (const item of CONSENT_ITEMS) {
    const v = fd.get(`c_${item.key}`)
    if (v !== 'yes' && v !== 'no') return { error: 'Please answer Yes or No for every statement.' }
    answers[item.key] = v === 'yes'
    if ('required' in item && item.required && v !== 'yes') return { error: `To continue you need to agree to: “${item.label}”` }
  }
  const h = await headers()
  return {
    value: {
      consent_date, emergency_contact, answers, signature,
      user_agent: h.get('user-agent')?.slice(0, 300) ?? null,
      ip: (h.get('x-forwarded-for') || '').split(',')[0].trim() || null,
    },
  }
}

export function text(fd: FormData, key: string, max = 4000) {
  const v = String(fd.get(key) ?? '').trim()
  return v ? v.slice(0, max) : null
}

export function bool(fd: FormData, key: string) {
  const v = fd.get(key)
  return v === 'yes' ? true : v === 'no' ? false : null
}

export function int(fd: FormData, key: string) {
  const v = String(fd.get(key) ?? '').trim()
  if (!v) return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null
}
