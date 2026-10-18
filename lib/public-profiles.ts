import 'server-only'
import { cache } from 'react'
import { db } from './supabase'
import type { Trainee } from './types'

// never select email, phone, UPI or notes for public pages
const PUBLIC_COLS = 'id, full_name, slug, photo_url, pronouns, city, languages, specialisations, bio, qualifications, experience, linkedin, availability, cohort_id'
export type PublicTrainee = Pick<Trainee, 'id' | 'full_name' | 'slug' | 'photo_url' | 'pronouns' | 'city' | 'languages' | 'specialisations' | 'bio' | 'qualifications' | 'experience' | 'linkedin' | 'availability' | 'cohort_id'>

const LISTED = ['invited', 'onboarded', 'active']

export const listPublicTrainees = cache(async () => {
  const { data } = await db().from('trainees').select(PUBLIC_COLS).eq('is_public', true).in('status', LISTED).not('slug', 'is', null).order('full_name')
  return (data ?? []) as PublicTrainee[]
})

export const getPublicTrainee = cache(async (slug: string) => {
  const { data } = await db().from('trainees').select(PUBLIC_COLS).eq('slug', slug).eq('is_public', true).in('status', LISTED).maybeSingle()
  return data as PublicTrainee | null
})
