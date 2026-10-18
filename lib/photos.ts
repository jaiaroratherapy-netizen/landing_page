import 'server-only'
import { randomBytes } from 'node:crypto'
import { db } from './supabase'

const BUCKET = 'trainee-photos'
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

/** Stores a trainee photo in the public bucket and returns its URL. */
export async function savePhoto(traineeId: string, file: File | Blob, type = file.type) {
  const ext = TYPES[type]
  if (!ext) throw new Error('Please upload a JPG, PNG or WebP image.')
  if (file.size > 4 * 1024 * 1024) throw new Error('That image is too large (max 4 MB).')
  const path = `${traineeId}/${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`
  const { error } = await db().storage.from(BUCKET).upload(path, file, { contentType: type, upsert: false, cacheControl: '31536000' })
  if (error) throw new Error('Could not upload the photo.')
  return db().storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

/** Removes an older photo we stored (ignores photos hosted elsewhere). */
export async function removePhoto(url: string | null) {
  const marker = `/storage/v1/object/public/${BUCKET}/`
  if (!url?.includes(marker)) return
  await db().storage.from(BUCKET).remove([decodeURIComponent(url.split(marker)[1])])
}
