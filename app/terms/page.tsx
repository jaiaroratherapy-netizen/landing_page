import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage } from '@/components/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms for using Kirana Counselling’s training platform and affordable therapy initiative.',
  alternates: { canonical: 'https://kiranacounselling.com/terms' },
}

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="18 October 2026">
      <p>These terms apply to anyone using kiranacounselling.com, its subdomains and the Kirana platform: instructors, trainee therapists and clients. By signing in or signing up you agree to them, together with our <Link href="/privacy">Privacy Policy</Link>.</p>

      <h2>1. What Kirana provides</h2>
      <p>Kirana Counselling trains therapists. Through our Affordable Therapy Initiative, clients receive sessions from <b>trainee therapists</b> who work under clinical supervision. Trainees are not yet fully qualified, independently practising therapists.</p>

      <h2>2. Not an emergency service</h2>
      <p>Kirana is <b>not</b> a crisis or emergency service. If you are in danger or thinking of harming yourself, call <b>Tele-MANAS 14416</b> (free, 24×7) or <b>112</b>, or go to the nearest hospital.</p>

      <h2>3. Eligibility</h2>
      <p>You must be 18 or older. Clients verify their identity with the Aadhaar Secure QR. You must give true information and use only your own identity.</p>

      <h2>4. Fees</h2>
      <ul>
        <li>For each client, the first three sessions are free.</li>
        <li>From session 4 onward, each session costs ₹299, paid entirely to the trainee therapist.</li>
        <li>These services are offered from September 2026 to November 2026 only. Kirana is not involved in any arrangement between a client and a trainee beyond this period, including private practice.</li>
      </ul>

      <h2>5. Bookings and cancellations</h2>
      <p>Clients and trainees can book, reschedule or cancel sessions on the platform. Please give as much notice as you can. Repeated no-shows may lead to your sessions ending.</p>

      <h2>6. Consent and recordings</h2>
      <p>Before therapy begins, clients and trainees sign a consent form with separate Yes/No choices about supervision, video recording and anonymised use of recordings. We follow the choices you made. You can withdraw any part of your consent at any time by emailing <a href="mailto:kirana.counselling@gmail.com">kirana.counselling@gmail.com</a>.</p>

      <h2>7. Trainee responsibilities</h2>
      <p>Trainees must keep client information confidential, use it only for the client’s therapy and supervision, follow their supervisor’s guidance and ethical codes, record sessions accurately on the platform, and never share their account.</p>

      <h2>8. Acceptable use</h2>
      <p>Do not misuse the platform: no false identities, no attempts to access other people’s data, no harassment, and no disrupting the service. We may suspend accounts that break these terms.</p>

      <h2>9. Liability</h2>
      <p>We work hard to provide a safe, good-quality service, but therapy outcomes cannot be guaranteed. To the extent the law allows, Kirana is not liable for indirect losses arising from use of the platform. Nothing in these terms limits liability that cannot be limited under Indian law.</p>

      <h2>10. Changes and ending</h2>
      <p>We may update these terms and will change the date above when we do. You may stop using the service at any time. These terms are governed by the laws of India, with courts in Delhi having jurisdiction.</p>

      <h2>Contact</h2>
      <p><a href="mailto:kirana.counselling@gmail.com">kirana.counselling@gmail.com</a></p>
    </LegalPage>
  )
}
