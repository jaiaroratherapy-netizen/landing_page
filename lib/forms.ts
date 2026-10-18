// Wording of every form, kept in one place so the forms and the read-out views always match.

export const CONSENT_ITEMS = [
  { key: 'age_18', label: 'I confirm that I am 18 or above years in age', required: true },
  { key: 'withdraw', label: 'I understand that I can withdraw consent at any time, for any part of this agreement just by emailing kirana.counselling@gmail.com' },
  { key: 'supervision', label: 'I consent to the contents of the sessions being shared with clinical supervisors and other trainees for supervision purposes, without my name and other identifiers' },
  { key: 'video', label: 'I consent to video recording of my sessions for clinical supervision and to ensure the quality of the service delivered' },
  { key: 'ai_training', label: "I consent to my (anonymised, personal information removed) session recordings being used to improve Kirana Counselling's aiClients platform, to help train future therapists." },
  { key: 'fees', label: 'I understand the first three sessions are free, and from Session 4 onward a ₹299 per-session charge applies, paid entirely to the trainee therapist.' },
  { key: 'period', label: 'I understand these services are offered only from September 2026 to November 2026, and Kirana Counselling is not involved in any arrangement beyond this period.' },
  { key: 'read_terms', label: 'I have read and understood all terms of this contract.', required: true },
] as const

export type ConsentKey = (typeof CONSENT_ITEMS)[number]['key']

export const TRAINEE_FEEDBACK = [
  { key: 'experience', label: 'How was your experience of taking Pro-bono sessions with Kirana?' },
  { key: 'continuing', label: 'Are your clients continuing with you? Mention name, what will you be charging and did they agree or not' },
  { key: 'did_well', label: 'If you were to tell us something this One Month Pro-bono training did well, what would that be?', hint: 'Eg- Jai watching videos etc' },
  { key: 'improve', label: 'What can we improve upon?', hint: 'Eg- need a more experienced supervisor, the process was rushed etc' },
  { key: 'else', label: 'Anything else left on your mind?' },
  { key: 'supervisor', label: 'Even if one client wants to continue with you, have you found an external supervisor yet?' },
  { key: 'new_consent', label: 'Have you made a new consent form that you will ask them to sign? It should have the money aspect, cancellation policies etc.' },
  { key: 'clients_sessions', label: 'How many clients did you have (write names) and how many sessions did you have with each?' },
] as const

export const CLIENT_FEEDBACK = [
  { key: 'experience', label: 'How was your experience with the therapist?' },
  { key: 'uncomfortable', label: 'Was there any point when your therapist made you feel uncomfortable (bad questions, facial expressions, tone etc)? If yes, please share that instance.', hint: 'This helps them improve.' },
  { key: 'org', label: 'As an organization, anything else we could have done to make the process easier for you?', hint: 'Eg- therapist should be assigned faster, need better quality etc' },
  { key: 'else', label: 'Anything else left on your mind?' },
  { key: 'recorder', label: 'Did the presence of the video recorder bother you?' },
  { key: 'did_well', label: 'What was one thing that the therapist did well?' },
] as const

export const FREE_SESSIONS = 3
export const SESSION_FEE = 299
