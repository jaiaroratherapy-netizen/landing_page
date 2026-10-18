// Imports trainees from a CSV (cohort, name, intro call link, email) and their public Serene profiles.
//   node --env-file=.env scripts/import-trainees.mjs trainees.csv [--dry]
// Safe to re-run: existing trainees only get fields that are still empty, so their own edits are kept.
import { readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const [file, flag] = process.argv.slice(2)
const DRY = flag === '--dry'
if (!file) { console.log('usage: node --env-file=.env scripts/import-trainees.mjs trainees.csv [--dry]'); process.exit(1) }
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } })

const CITIES = { 'delhi-ncr': 'Delhi NCR', mumbai: 'Mumbai', bangalore: 'Bengaluru', pune: 'Pune', jaipur: 'Jaipur', hyderabad: 'Hyderabad', chennai: 'Chennai', kolkata: 'Kolkata' }
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ } else if (c === '"') q = false; else cell += c }
    else if (c === '"') q = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = '' }
    else cell += c
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((x) => x.trim()))
}

const cleanLanguages = (list) => [...new Set((list ?? []).map((l) => l.replace(/\(.*?\)/g, '').trim()).filter(Boolean))].join(', ')
const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-')
const titleCase = (s) => s.replace(/\s+/g, ' ').trim()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function serene(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Kirana import)' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()
  const at = html.indexOf('window.__INITIAL_DATA__')
  if (at < 0) throw new Error('no profile data on page')
  const seg = html.slice(at)
  const start = seg.indexOf('{')
  // walk to the matching brace (the JSON is followed by more script)
  let depth = 0, inStr = false, esc = false, end = start
  for (let i = start; i < seg.length; i++) {
    const c = seg[i]
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue }
    if (c === '"') inStr = true; else if (c === '{') depth++; else if (c === '}' && --depth === 0) { end = i + 1; break }
  }
  return JSON.parse(seg.slice(start, end)).userData ?? {}
}

function availability(av) {
  const out = {}
  for (const d of DAYS) {
    const slots = (av?.[d] ?? []).filter((s) => /^\d\d:\d\d$/.test(s.start_time) && /^\d\d:\d\d$/.test(s.end_time)).map(({ start_time, end_time }) => ({ start_time, end_time }))
    if (slots.length) out[d] = slots
  }
  return Object.keys(out).length ? out : null
}

async function uploadPhoto(traineeId, url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`photo HTTP ${res.status}`)
  const type = (res.headers.get('content-type') || 'image/jpeg').split(';')[0]
  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[type]
  if (!ext) throw new Error(`photo type ${type}`)
  const path = `${traineeId}/serene-${randomBytes(4).toString('hex')}.${ext}`
  const { error } = await sb.storage.from('trainee-photos').upload(path, Buffer.from(await res.arrayBuffer()), { contentType: type, cacheControl: '31536000' })
  if (error) throw error
  return sb.storage.from('trainee-photos').getPublicUrl(path).data.publicUrl
}

// ---------- preflight ----------
const { error: colErr } = await sb.from('trainees').select('slug, photo_url, availability').limit(1)
if (colErr) { console.log('✗ Run supabase/migrations/002_public_profiles.sql in Supabase first.\n ', colErr.message); process.exit(1) }

// ---------- read CSV and profiles ----------
const rows = parseCsv(readFileSync(file, 'utf8')).slice(1).map((r) => ({
  cohort: r[0]?.trim(), name: titleCase(r[1] ?? ''), link: r[2]?.trim() || null, email: (r[3] ?? '').trim().toLowerCase() || null,
})).filter((r) => r.name)

console.log(`Fetching ${rows.filter((r) => r.link).length} Serene profiles…`)
const profiles = []
for (const r of rows) {
  if (!r.link) continue
  try { profiles.push({ link: r.link, row: r, data: await serene(r.link) }) } catch (e) { console.log(`  ! ${r.name}: ${e.message}`) }
  await sleep(500)
}

// a profile belongs to whoever has its email, even if the link sits on another row of the sheet
const byEmail = new Map(profiles.filter((p) => p.data.email).map((p) => [p.data.email.toLowerCase(), p]))
const people = rows.map((r) => {
  const own = profiles.find((p) => p.row === r)
  const email = r.email || own?.data.email?.toLowerCase() || null
  const profile = (email && byEmail.get(email)) || (!r.email && own) || null
  if (own && profile !== own) console.log(`  ↪ ${r.name}: the link on this row is ${own.data.display_name}'s profile (${own.data.email}); matched by email instead`)
  return { ...r, email, profile }
})

// ---------- write ----------
const cohortIds = {}
for (const code of [...new Set(people.map((p) => p.cohort).filter(Boolean))]) {
  const name = /^C(\d+)$/i.test(code) ? `Cohort ${code.slice(1)}` : code
  let { data } = await sb.from('cohorts').select('id').eq('name', name).maybeSingle()
  if (!data && !DRY) data = (await sb.from('cohorts').insert({ name, starts_on: '2026-09-01', ends_on: '2026-11-30' }).select('id').single()).data
  cohortIds[code] = data?.id
  console.log(`${data ? '✓' : '+'} ${name}`)
}

const { data: existing } = await sb.from('trainees').select('*')
const taken = new Set((existing ?? []).map((t) => t.slug).filter(Boolean))
const freeSlug = (name) => { const base = slugify(name) || 'therapist'; let s = base, n = 2; while (taken.has(s)) s = `${base}-${n++}`; taken.add(s); return s }

const summary = { created: 0, updated: 0, photos: 0, skipped: [] }
for (const p of people) {
  if (!p.email) { summary.skipped.push(`${p.name} (no email in sheet or profile)`); continue }
  const v = p.profile?.data ?? {}
  const upi = v.payment_data?.link && /@/.test(v.payment_data.link) ? v.payment_data.link : null
  const fromProfile = {
    bio: v.about?.trim() || null,
    languages: cleanLanguages(v.languages) || null,
    specialisations: (v.expertise ?? []).join(', ') || null,
    city: CITIES[v.directory_city] ?? null,
    experience: v.experience?.trim() || null,
    linkedin: v.linkedin?.trim() || null,
    availability: availability(v.availability),
    intro_call_url: p.profile?.link ?? null,
    serene_username: v.username ?? null,
    upi_id: upi,
  }
  const current = (existing ?? []).find((t) => t.email === p.email)
  let id = current?.id
  if (!current) {
    const row = { email: p.email, full_name: p.name, cohort_id: cohortIds[p.cohort] ?? null, slug: freeSlug(p.name), status: 'invited', ...fromProfile }
    if (DRY) { console.log(`  + would create ${p.name} <${p.email}>`); summary.created++; continue }
    const { data, error } = await sb.from('trainees').insert(row).select('id').single()
    if (error) { summary.skipped.push(`${p.name}: ${error.message}`); continue }
    id = data.id
    await sb.from('invites').insert({ token: randomBytes(24).toString('base64url'), kind: 'trainee_onboarding', trainee_id: id, created_by: 'import' })
    summary.created++
  } else {
    // fill only what is still empty
    const patch = Object.fromEntries(Object.entries({ ...fromProfile, cohort_id: cohortIds[p.cohort] ?? null, slug: current.slug ?? freeSlug(p.name) })
      .filter(([k, val]) => val != null && (current[k] == null || current[k] === '')))
    if (Object.keys(patch).length) {
      if (!DRY) await sb.from('trainees').update(patch).eq('id', id)
      summary.updated++
    }
  }
  if (!DRY && v.display_picture && !(current?.photo_url)) {
    try {
      const url = await uploadPhoto(id, v.display_picture)
      await sb.from('trainees').update({ photo_url: url }).eq('id', id)
      summary.photos++
    } catch (e) { console.log(`  ! photo for ${p.name}: ${e.message}`) }
  }
  console.log(`  ✓ ${p.name}${p.profile ? '' : ' (no Serene profile)'}`)
}

console.log(`\n${DRY ? '[dry run] ' : ''}${summary.created} created, ${summary.updated} updated, ${summary.photos} photos saved`)
if (summary.skipped.length) console.log('Skipped:\n  ' + summary.skipped.join('\n  '))
