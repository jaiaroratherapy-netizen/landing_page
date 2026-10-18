export type Cohort = { id: string; name: string; starts_on: string | null; ends_on: string | null; notes: string | null; created_at: string }

export type TraineeStatus = 'invited' | 'onboarded' | 'active' | 'paused' | 'completed'
export type Trainee = {
  id: string; user_id: string | null; email: string; full_name: string; phone: string | null
  cohort_id: string | null; status: TraineeStatus; pronouns: string | null; languages: string | null
  qualifications: string | null; specialisations: string | null; bio: string | null; upi_id: string | null
  emergency_contact: string | null; max_clients: number; admin_notes: string | null; created_at: string; updated_at: string
  slug: string | null; photo_url: string | null; intro_call_url: string | null; city: string | null; experience: string | null
  linkedin: string | null; availability: Availability | null; is_public: boolean; serene_username: string | null
}

export type Slot = { start_time: string; end_time: string }
export type Availability = Partial<Record<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday', Slot[]>>

export type ClientStatus = 'new' | 'assigned' | 'active' | 'paused' | 'dropped' | 'completed'
export type Client = {
  id: string; user_id: string | null; email: string; full_name: string; whatsapp: string | null
  reason: string | null; diagnosis: string | null; self_harm: string | null; org: string | null; pref: string | null
  aadhaar_last4: string | null; birth_year: number | null; gender: string | null; id_hash: string | null
  id_verified_by: string | null; mobile_match: boolean | null; qr_generated_at: string | null
  pronouns: string | null; emergency_contact: string | null; trainee_id: string | null; assigned_at: string | null
  status: ClientStatus; admin_notes: string | null; created_at: string; updated_at: string
}

export type Invite = {
  token: string; kind: 'trainee_onboarding' | 'client_consent'; trainee_id: string | null; client_id: string | null
  created_by: string | null; created_at: string; expires_at: string; used_at: string | null
}

export type Consent = {
  id: string; kind: 'trainee' | 'client'; trainee_id: string | null; client_id: string | null
  consent_date: string; emergency_contact: string; answers: Record<string, boolean>; signature: string; signed_at: string
}

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'
export type Session = {
  id: string; client_id: string; trainee_id: string; scheduled_at: string; duration_min: number
  status: SessionStatus; meeting_link: string | null; trainee_notes: string | null; created_by: string | null
  cancelled_by: string | null; cancel_reason: string | null; reschedule_count: number; client_paid: boolean
  kind: 'intro' | 'session'; google_event_id: string | null
  created_at: string; updated_at: string
}

export type Tracking = {
  client_id: string; trainee_id: string | null; intro_call: boolean | null; first_session: boolean | null
  first_session_feedback: string | null; sessions_taken: number | null; dropped_out: boolean | null
  dropout_reason: string | null; dropout_after: number | null; overall_feedback: string | null
  private_practice: boolean | null; private_price: number | null; updated_at: string
}

export type Feedback = {
  id: string; trainee_id: string | null; client_id?: string; session_id: string | null
  answers: Record<string, string>; created_at: string
}

export type Payout = { id: string; trainee_id: string; amount: number; paid_on: string; reference: string | null; note: string | null; created_at: string }

export type Activity = { id: number; actor: string | null; action: string; entity: string | null; entity_id: string | null; detail: string | null; created_at: string }
