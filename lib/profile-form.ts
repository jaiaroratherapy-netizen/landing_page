import 'server-only'
import { text } from './consent'
import { DAYS, cleanLanguages, parseSlots, slugify } from './profiles'
import type { Availability, Trainee } from './types'

function url(fd: FormData, key: string) {
  const v = text(fd, key, 500)
  if (!v) return { value: null }
  try {
    const u = new URL(/^https?:\/\//.test(v) ? v : `https://${v}`)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error()
    return { value: u.toString() }
  } catch { return { error: `“${v}” is not a valid link.` } }
}

/** Public-profile fields shared by the trainee's own form and the admin's trainee form. */
export function parsePublicProfile(fd: FormData): { error: string } | { patch: Partial<Trainee> } {
  const linkedin = url(fd, 'linkedin')
  if ('error' in linkedin) return { error: linkedin.error! }

  const availability: Availability = {}
  for (const d of DAYS) {
    const slots = parseSlots(String(fd.get(`av_${d}`) ?? ''))
    if (slots === null) return { error: `Availability for ${d[0].toUpperCase() + d.slice(1)}: use times like 19:00-20:00, 21:00-22:30` }
    if (slots.length) availability[d] = slots
  }

  return {
    patch: {
      bio: text(fd, 'bio', 3000),
      specialisations: text(fd, 'specialisations', 500),
      languages: cleanLanguages(text(fd, 'languages', 300)) || null,
      city: text(fd, 'city', 80),
      experience: text(fd, 'experience', 1500),
      qualifications: text(fd, 'qualifications', 500),
      pronouns: text(fd, 'pronouns', 60),
      linkedin: linkedin.value ?? null,
      availability: Object.keys(availability).length ? availability : null,
      is_public: fd.get('is_public') === 'on',
    },
  }
}

export function parseSlug(fd: FormData, fallbackName: string) {
  const raw = text(fd, 'slug', 80)
  const slug = slugify(raw || fallbackName)
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) ? slug : null
}
