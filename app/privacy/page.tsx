import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Kirana Counselling collects, uses and protects the personal data of trainee therapists and clients.',
  alternates: { canonical: 'https://kiranacounselling.com/privacy' },
}

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="22 October 2026">
      <p>Kirana Counselling (“Kirana”, “we”) runs therapist training and an affordable therapy initiative at kiranacounselling.com and its subdomains. This policy explains what personal data we collect, why, and the choices you have. It is written to meet India’s Digital Personal Data Protection Act, 2023.</p>

      <h2>Who this covers</h2>
      <ul>
        <li><b>Instructors</b>: Kirana staff who run cohorts and supervise.</li>
        <li><b>Trainees</b>: trainee therapists in our training programme.</li>
        <li><b>Clients</b>: people who sign up for therapy sessions with trainees.</li>
      </ul>

      <h2>What we collect</h2>
      <ul>
        <li><b>Account data from Google Sign-In</b>: your name, email address and profile picture URL, through the basic “openid”, “email” and “profile” scopes. We do not access your Gmail, Drive or contacts.</li>
        <li><b>Google Calendar (trainee therapists only, optional)</b>: if a trainee connects their calendar, we use the “calendar.freebusy” scope to see which times they are busy (not what their events are), and the “calendar.events” scope to add, update and cancel the sessions booked through Kirana, with a Google Meet link. We store a refresh token for this on our server, and never read, change or delete any other events.</li>
        <li><b>Sign-up details (clients)</b>: email, WhatsApp number, what brings you to therapy, any diagnosis, whether you have had thoughts of self-harm, your college or organisation and any therapist preference.</li>
        <li><b>Identity check (clients)</b>: you scan the Secure QR on your Aadhaar. Your browser and our server check UIDAI’s digital signature. We keep only your name, the last 4 digits of your Aadhaar number, birth year, gender, whether your mobile number matches Aadhaar, and a one-way hash used to prevent duplicate sign-ups. We <b>do not</b> store your full Aadhaar number, address, photo or the QR itself.</li>
        <li><b>Consent forms</b>: the date, your emergency contact, your Yes/No answers, your typed signature, and the time, browser and IP address of signing.</li>
        <li><b>Therapy records</b>: intro calls and session dates and status, the therapist’s private notes, the therapist’s tracking of your progress, and payment status for sessions from session 4.</li>
        <li><b>Feedback</b>: forms clients and trainees fill after sessions.</li>
        <li><b>Trainee profile</b>: phone, cohort, qualifications, languages, bio and UPI ID for payouts.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To verify that each client is a real adult (18+) and sign them up once.</li>
        <li>To match clients with trainee therapists, schedule sessions and keep therapy records.</li>
        <li>For clinical supervision and quality, only as you consented to in your consent form.</li>
        <li>To calculate session fees and trainee payouts.</li>
        <li>To contact you about your sessions by WhatsApp or email: for example a welcome email, your therapist assignment, consent links and booking confirmations, sent from kirana.counselling@gmail.com.</li>
        <li>To improve our training, using feedback and anonymised statistics.</li>
      </ul>
      <p>Session recordings are used for supervision or for improving Kirana’s aiClients training platform <b>only if</b> you said Yes to those statements in your consent form, and always anonymised with personal information removed.</p>

      <h2>Who can see your data</h2>
      <ul>
        <li><b>Clients’ data</b> is visible to their assigned trainee therapist and to Kirana instructors.</li>
        <li><b>Client feedback</b> is visible to the therapist and to instructors. <b>Trainee feedback</b> is visible only to instructors.</li>
        <li>We never sell personal data or use it for advertising.</li>
        <li>Our service providers process data on our behalf: <b>Supabase</b> (database and sign-in), <b>Vercel</b> (hosting) and <b>Google</b> (Sign-In, Calendar for trainees who connect it, and Gmail for our emails). They may store data outside India under their own security commitments.</li>
        <li>We may disclose data if the law requires it, or if someone’s life or safety is at serious risk.</li>
      </ul>

      <h2>Google user data</h2>
      <p>Kirana’s use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>, including the Limited Use requirements. We use your Google name and email only to sign you in. For trainees who connect Google Calendar, we use free/busy information only to show clients available times, and we only create, update and delete the session events Kirana booked. Google user data is not sold, not transferred to others except as needed to provide these features, not used for advertising, and not used to train AI models. Trainees can disconnect their calendar at any time from their Profile page, which deletes our stored access and revokes it at Google.</p>

      <h2>Security</h2>
      <p>Data is encrypted in transit (HTTPS) and at rest. The database is locked down so it can only be read through our server after we check who you are and what your role allows. Access for instructors is limited to named Kirana staff.</p>

      <h2>How long we keep it</h2>
      <p>The therapy initiative runs from September to November 2026. We keep records for up to 3 years after your last session for supervision, safety and legal reasons, then delete or fully anonymise them. You can ask us to delete your data sooner (see below). We may need to keep some records if the law requires it.</p>

      <h2>Your rights</h2>
      <p>You can ask to access, correct or delete your personal data, withdraw any consent, or raise a grievance by emailing <a href="mailto:kirana.counselling@gmail.com">kirana.counselling@gmail.com</a>. We will reply within 30 days. Withdrawing consent does not affect anything done before you withdrew. You can also remove Kirana’s access to your Google account any time at <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>.</p>

      <h2>Children</h2>
      <p>Our services are only for people aged 18 and above. We block sign-ups when the Aadhaar shows the person is under 18.</p>

      <h2>Changes</h2>
      <p>If we change this policy we will update the date above, and tell active users of any important change.</p>

      <h2>Contact</h2>
      <p>Kirana Counselling, Delhi, India · <a href="mailto:kirana.counselling@gmail.com">kirana.counselling@gmail.com</a></p>
    </LegalPage>
  )
}
