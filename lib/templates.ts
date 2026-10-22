// WhatsApp message templates. {placeholders} are filled per recipient; admins can override the wording.

export type Audience = 'client' | 'trainee'
export type Template = { key: string; audience: Audience; from: 'trainee' | 'admin'; title: string; when: string; body: string }

export const TEMPLATES: Template[] = [
  // trainee → their client
  { key: 'client_hello', audience: 'client', from: 'trainee', title: 'Introduce yourself', when: 'Within 24 hours of being assigned',
    body: 'Hi {client_first}! I’m {therapist_first}, a trainee therapist with Kirana Counselling, and I’ll be your therapist 🙂\n\nYou can book a free 20-minute intro call with me here: {intro_link}\n\nLooking forward to meeting you!' },
  { key: 'client_consent', audience: 'client', from: 'trainee', title: 'Consent form', when: 'Before the first session',
    body: 'Hi {client_first}, before our first session please read and sign the Kirana Counselling consent form. It explains how sessions, fees and confidentiality work, and you can say no to any optional part:\n{consent_link}\n\nIt takes about 10 minutes. Let me know if you have any questions.' },
  { key: 'client_reminder', audience: 'client', from: 'trainee', title: 'Session reminder', when: 'A day before the session',
    body: 'Hi {client_first}, a gentle reminder about our session on {next_session}.\nJoin here: {meeting_link}\n\nSee you then!' },
  { key: 'client_book_next', audience: 'client', from: 'trainee', title: 'Book the next session', when: 'After a session',
    body: 'Hi {client_first}, thank you for today. You can pick a time for our next session here: {session_link}' },
  { key: 'client_payment', audience: 'client', from: 'trainee', title: 'Payment for session 4 onwards', when: 'At least 24 hours before a paid session',
    body: 'Hi {client_first}, our upcoming session on {next_session} is session {next_number}. From session 4 the fee is ₹299 per session, payable at least 24 hours before the session.\n\nUPI: {upi_id}\n\nPlease share a screenshot once paid. Thank you!' },
  { key: 'client_feedback', audience: 'client', from: 'trainee', title: 'Ask for feedback', when: 'After a session',
    body: 'Hi {client_first}, thank you for today’s session. If you have 2 minutes, I’d really value your feedback. It helps me grow as a therapist:\n{feedback_link}' },
  { key: 'client_reschedule', audience: 'client', from: 'trainee', title: 'You need to reschedule', when: 'At least 24 hours ahead',
    body: 'Hi {client_first}, I’m sorry, I need to move our session on {next_session}. Could you pick a new time that suits you here? {session_link}\n\nThank you for understanding.' },
  { key: 'client_no_show', audience: 'client', from: 'trainee', title: 'Missed session', when: '15 minutes after a no-show',
    body: 'Hi {client_first}, I waited for you for our session today. I hope everything is okay. Whenever you’re ready, you can book another time here: {session_link}' },
  { key: 'client_closing', audience: 'client', from: 'trainee', title: 'Programme ending', when: '3 weeks before the programme ends',
    body: 'Hi {client_first}, a heads-up: the Kirana Counselling programme ends on 30 November 2026. If you’d like to continue with me privately after that, we can talk about it in our next session. No pressure either way.' },

  // admin → client
  { key: 'admin_client_matched', audience: 'client', from: 'admin', title: 'Therapist assigned', when: 'After assigning a therapist',
    body: 'Hi {client_first}, this is Kirana Counselling 💛 Your therapist is {therapist_name}. You can see their profile and book a free intro call here: {intro_link}' },
  { key: 'admin_client_waiting', audience: 'client', from: 'admin', title: 'Still matching', when: 'If a client is waiting',
    body: 'Hi {client_first}, this is Kirana Counselling. Thank you for your patience! You can also choose a therapist yourself and book a free intro call: {therapists_link}' },

  // admin → trainee
  { key: 'admin_trainee_onboarding', audience: 'trainee', from: 'admin', title: 'Onboarding link', when: 'When inviting a trainee',
    body: 'Hi {trainee_first}! Welcome to Kirana Counselling 💛 Please read the trainee contract and complete your onboarding & consent form (sign in with {trainee_email}):\n{onboarding_link}' },
  { key: 'admin_trainee_profile', audience: 'trainee', from: 'admin', title: 'Finish your profile', when: 'If photo, intro or hours are missing',
    body: 'Hi {trainee_first}, please complete your public profile (photo, short intro) and weekly availability so clients can find and book you: {profile_link}' },
  { key: 'admin_trainee_calendar', audience: 'trainee', from: 'admin', title: 'Connect Google Calendar', when: 'If the calendar isn’t connected',
    body: 'Hi {trainee_first}, please connect your Google Calendar on your Kirana profile. Bookings will then appear there with a Meet link automatically: {profile_link}' },
  { key: 'admin_trainee_new_client', audience: 'trainee', from: 'admin', title: 'New client', when: 'After assigning a client',
    body: 'Hi {trainee_first}, you have a new client: {client_first}. Please reach out within 24 hours and send them the consent form: {client_page_link}' },
  { key: 'admin_trainee_update_sessions', audience: 'trainee', from: 'admin', title: 'Update past sessions', when: 'If sessions aren’t marked',
    body: 'Hi {trainee_first}, a quick reminder to mark your past sessions as completed or no-show so billing stays correct: {sessions_link}' },
]

export const PLACEHOLDER_HELP: Record<string, string> = {
  client_first: 'Client’s first name', client_name: 'Client’s full name', therapist_first: 'Therapist’s first name', therapist_name: 'Therapist’s full name',
  intro_link: 'Booking link for a free intro call', session_link: 'Booking link for a session', consent_link: 'Client’s consent form link',
  next_session: 'Date and time of the next session', next_number: 'Number of the next session', meeting_link: 'Meet link of the next session',
  upi_id: 'Therapist’s UPI ID', feedback_link: 'Feedback page', therapists_link: 'Therapist directory',
  trainee_first: 'Trainee’s first name', trainee_email: 'Trainee’s email', onboarding_link: 'Trainee’s onboarding link',
  profile_link: 'Trainee’s profile page', client_page_link: 'Latest client’s page', sessions_link: 'Trainee’s sessions page',
}

/** Fills {placeholders}; unknown or empty ones are left visible as [placeholder] so they get noticed. */
export function render(body: string, values: Record<string, string | null | undefined>) {
  return body.replace(/\{(\w+)\}/g, (_, k: string) => values[k] || `[${PLACEHOLDER_HELP[k]?.toLowerCase() ?? k}]`)
}

export function missing(body: string, values: Record<string, string | null | undefined>) {
  return [...body.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).filter((k) => !values[k])
}
