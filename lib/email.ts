import 'server-only'
import nodemailer, { type Transporter } from 'nodemailer'
import { after } from 'next/server'
import { db } from './supabase'

// Every email goes through the email_outbox table: nothing is lost if Gmail is briefly unavailable,
// delayed emails (like assignment notices) wait their turn, and failures retry with backoff.

const FROM_NAME = 'Kirana Counselling'
const MAX_ATTEMPTS = 5

export function emailConfigured() {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
}

let transport: Transporter | null = null
function mailer() {
  transport ??= nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 465, secure: true,
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '') },
  })
  return transport
}

export type QueueOptions = {
  kind: string
  to?: string | null
  subject?: string
  html?: string
  payload?: Record<string, unknown>
  /** a newer email with the same key replaces a pending one (e.g. one assignment notice per client) */
  dedupeKey?: string
  delayMinutes?: number
}

/** Adds an email (or a deferred job) to the outbox, and sends due mail right after the response. */
export async function queueEmail(o: QueueOptions) {
  if (o.dedupeKey) await db().from('email_outbox').update({ status: 'cancelled' }).eq('dedupe_key', o.dedupeKey).eq('status', 'pending')
  await db().from('email_outbox').insert({
    kind: o.kind, to_email: o.to?.toLowerCase() ?? null, subject: o.subject ?? null, html: o.html ?? null, payload: o.payload ?? null,
    dedupe_key: o.dedupeKey ?? null, send_after: new Date(Date.now() + (o.delayMinutes ?? 0) * 60_000).toISOString(),
  })
  if (!o.delayMinutes) after(() => processOutbox().catch(() => {}))
}

type Row = { id: string; kind: string; to_email: string | null; subject: string | null; html: string | null; payload: Record<string, unknown> | null; attempts: number }
type Job = (row: Row) => Promise<'sent' | 'skipped'>
const jobs = new Map<string, Job>()

/** Deferred jobs decide what to send when they run (e.g. the assignment check). */
export function registerJob(kind: string, job: Job) { jobs.set(kind, job) }

export async function sendNow(to: string, subject: string, html: string) {
  if (!emailConfigured()) throw new Error('Email is not set up (GMAIL_USER / GMAIL_APP_PASSWORD)')
  await mailer().sendMail({
    from: { name: FROM_NAME, address: process.env.GMAIL_USER! }, to, subject, html, text: htmlToText(html),
    replyTo: process.env.GMAIL_USER,
  })
}

/** Sends everything that is due. Safe to call concurrently: each row is claimed before sending. */
export async function processOutbox(limit = 25) {
  if (!emailConfigured()) return { sent: 0, failed: 0, skipped: 0 }
  const { data: due } = await db().from('email_outbox').select('*').eq('status', 'pending')
    .lte('send_after', new Date().toISOString()).order('send_after').limit(limit)
  let sent = 0, failed = 0, skipped = 0
  for (const row of (due ?? []) as Row[]) {
    const { data: claimed } = await db().from('email_outbox').update({ status: 'sending' }).eq('id', row.id).eq('status', 'pending').select('id')
    if (!claimed?.length) continue
    try {
      const job = jobs.get(row.kind)
      const result = job ? await job(row) : (await sendNow(row.to_email!, row.subject!, row.html!), 'sent' as const)
      await db().from('email_outbox').update({ status: result, sent_at: new Date().toISOString(), attempts: row.attempts + 1 }).eq('id', row.id)
      if (result === 'sent') sent++; else skipped++
    } catch (e) {
      const attempts = row.attempts + 1
      await db().from('email_outbox').update({
        status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending', attempts, last_error: (e as Error).message.slice(0, 500),
        send_after: new Date(Date.now() + 2 ** attempts * 60_000).toISOString(),
      }).eq('id', row.id)
      failed++
    }
  }
  return { sent, failed, skipped }
}

// ---------- layout ----------

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

/** Kirana-branded email. `blocks` are trusted HTML snippets built with the helpers below. */
export function layout(opts: { preheader: string; heading: string; blocks: string[]; site: string }) {
  return `<!doctype html><html><body style="margin:0;background:#F6E9CC;font-family:Helvetica,Arial,sans-serif;color:#4A1E48">
<span style="display:none;opacity:0;max-height:0;overflow:hidden">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6E9CC;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FBF3E1;border-radius:18px;padding:28px 26px">
<tr><td align="center" style="padding-bottom:10px"><img src="${opts.site}/kirana-logo.png" width="72" alt="Kirana Counselling" style="display:block"></td></tr>
<tr><td style="font-family:Georgia,serif;font-size:24px;font-weight:bold;padding-bottom:12px;text-align:center">${esc(opts.heading)}</td></tr>
<tr><td style="font-size:15px;line-height:1.6">${opts.blocks.join('')}</td></tr>
<tr><td style="padding-top:22px;border-top:1px solid rgba(74,30,72,.14);font-size:12px;color:#7A5C4E;line-height:1.5">
Kirana Counselling · <a href="${opts.site}" style="color:#A62B4E">kiranacounselling.com</a> · Reply to this email or write to kirana.counselling@gmail.com<br>
Not an emergency service. In a crisis call Tele-MANAS 14416 or 112.</td></tr>
</table></td></tr></table></body></html>`
}

export const p = (text: string) => `<p style="margin:0 0 14px">${esc(text)}</p>`
export const pHtml = (html: string) => `<p style="margin:0 0 14px">${html}</p>`
export const button = (href: string, label: string) =>
  `<p style="margin:18px 0"><a href="${esc(href)}" style="display:inline-block;background:#A62B4E;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">${esc(label)}</a></p>`
export const list = (items: string[]) => `<ul style="margin:0 0 14px;padding-left:20px">${items.map((i) => `<li style="margin:0 0 6px">${esc(i)}</li>`).join('')}</ul>`
export const box = (title: string, lines: string[]) =>
  `<div style="background:#fff;border:1px solid rgba(74,30,72,.14);border-radius:12px;padding:14px 16px;margin:0 0 14px"><b>${esc(title)}</b><br>${lines.map(esc).join('<br>')}</div>`

function htmlToText(html: string) {
  return html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, '$2 ($1)')
    .replace(/<br\s*\/?>/g, '\n').replace(/<\/(p|li|tr|div)>/g, '\n').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n').trim()
}
