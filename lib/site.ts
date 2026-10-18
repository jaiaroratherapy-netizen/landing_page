import 'server-only'
import { headers } from 'next/headers'

/** Origin of the current request, e.g. https://kiranacounselling.com or http://localhost:8989. */
export async function origin() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '')
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:8989'
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}
