// Contract text shown above the consent questions. Wording supplied by Kirana Counselling; keep it verbatim.

export type Block = { p: string } | { ul: string[] } | { table: [string, string][]; head?: [string, string] }
export type Section = { title: string; blocks: Block[] }
export type Contract = { title: string; intro: string[]; sections: Section[] }

export const TRAINEE_CONTRACT: Contract = {
  title: 'Trainee consent and contract form',
  intro: [
    'This contract is between the Trainee Therapist ("you" or "the trainee") and Kirana Counselling. It outlines the responsibilities, expectations, and boundaries that govern your participation in the pro bono training programme. Please read this carefully, by signing, you agree to all terms stated here.',
    'More than a legally binding document, this document entails what we expect from you as a Trainee Therapist offering Affordable Therapy Sessions, a professional service, to clients.',
  ],
  sections: [
    {
      title: 'Programme Details',
      blocks: [
        { p: 'This is a structured pro bono training programme run by Kirana Counselling, September – December 2026.' },
        { p: 'The minimum number of practicum hours is 30 with maximum being 50. Within these hours, you need to complete at least 5 sessions with a minimum of 3 clients. Eg- 5 sessions with client A, 9 sessions with client B and 6 sessions with client C. The rest of the client may have 2 sessions, 1 session etc.' },
        { p: 'During the programme, the first 3 sessions are free and sessions from Session 4 onward are charged at ₹299 per session.' },
        { p: 'Kirana Counselling takes no cut of this, it goes entirely to you.' },
        { p: 'After the programme concludes, Kirana Counselling is no longer responsible for your clinical supervision or any support related to these cases. You have to arrange your own supervisor for continued private practice (see Section 10).' },
        {
          head: ['Requirement', 'Minimum'],
          table: [
            ['Total practicum hours', '30 hours'],
            ['Number of clients', '5'],
            ['Sessions per client', '5 or more (with at least 3 different clients)'],
            ['Supervision attendance', 'Minimum 75%'],
            ['Case notes/documentation', 'Weekly submission, in prescribed format'],
          ],
        },
      ],
    },
    {
      title: 'Communication and Availability',
      blocks: [
        { p: 'You must use a dedicated professional number (not your personal number) for all client communication and the client communication will only happen via WhatsApp Business App.' },
        { p: 'Your professional availability hours are 9:00 AM – 9:00 PM, Monday to Saturday. You are not expected to respond outside these hours, unless it is an emergency, either the client\'s or your own.' },
        { p: 'If you are unavailable for a scheduled session, you must inform the client at least 24 hours in advance. If you have taken the fee for the same, please forward it to the next session.' },
      ],
    },
    {
      title: 'Client Work',
      blocks: [{ ul: [
        'Work to the best of your ability, within your current level of training at all times.',
        'If a client\'s needs exceed your competence at any point, escalate this to your supervisor immediately and facilitate an appropriate referral. Do not attempt to manage complex presentations (e.g. active suicidality, psychosis, severe trauma) independently.',
        'Attend your own personal therapy regularly, throughout the programme.',
        'Attend supervision regularly, a minimum of 75% attendance is required. If you cannot commit to this, please do not enrol: supervision is crucial to the safety of your clients and the integrity of your training.',
        'Show up to all scheduled sessions on time and maintain professional conduct.',
        'If an assigned client turns out to be a personal acquaintance, or someone from your own social or personal circle, you must disclose this to Kirana Counselling immediately. The client will then be reassigned to another trainee therapist.',
      ] }],
    },
    {
      title: 'Crisis Protocol',
      blocks: [{ ul: [
        'If a client discloses a crisis situation during or between sessions, follow the crisis protocols mandated by Team Kirana.',
        'Share all emergency or crisis cases with the Kirana Counselling team promptly, even after the immediate situation is handled.',
        'Before the programme begins, verify that all helpline numbers you plan to share with clients are active and working.',
      ] }],
    },
    {
      title: 'Confidentiality',
      blocks: [{ ul: [
        'Do not share a client\'s name, not in supervision (only screen share), not with peers, not in general conversation, under any circumstance.',
        'Do not share session videos, under any circumstance, this includes triad practice recordings and client session recordings alike.',
        'Unauthorised disclosure of client information is a criminal offence under Section 72A of the Information Technology Act, 2000.',
        'If a client discloses an instance of child sexual abuse, Indian law (the POCSO Act, 2012) requires you to report this to the police. This is your personal legal obligation, it overrides client confidentiality. Report to your supervisor immediately if this occurs; they will support you through the process.',
      ] }],
    },
    {
      title: 'Session Recording',
      blocks: [{ ul: [
        'All sessions must be recorded using Fathom (or another tool approved by Kirana Counselling). You are required to learn how to use Fathom before your first session, setup guidance will be shared separately.',
        'If a client has said no to recording, that decision is final, no recording takes place, no exceptions.',
        'If a client consented to recording in their signed form but says no in the moment, follow their real-time wishes and stop recording, their in-session decision overrides the signed consent.',
        'You must not delete any session recording without explicit written permission from Kirana Counselling.',
        'Recordings must be uploaded to your dedicated Google Drive, anonymised, folder, stored securely, and never shared with anyone outside Kirana Counselling.',
        'You will lose access to Kirana Counselling\'s Google Drive, and your therapy session recordings on it (not the first 3 months of training), immediately once your cohort ends. This is automatic and applies to all trainees.',
        'Regarding the session recording for the first 3 months of training, you shall have access to them forever. But the trainee is mandated to not share it with anyone else.',
      ] }],
    },
    {
      title: 'Documentation and Notetaking',
      blocks: [{ ul: [
        'Maintain weekly session notes in the format prescribed by Kirana Counselling; a notetaking template and weekly submission deadline will be shared before the programme begins.',
        'Never write a client\'s name anywhere in your notes or any other documents. Maintain anonymised folders properly at all times.',
        'All notes are confidential and must be stored securely in the designated, HIPPA Compliant, platform.',
        'Case notes, reflections, and other documentation you produce during the programme remain accessible to you, you may request and download a copy of your own notes at the time of programme termination.',
      ] }],
    },
    {
      title: 'Continuing Beyond the Programme',
      blocks: [{ ul: [
        'If a client wishes to continue working with you privately after the programme ends, inform them of this option at least 3 weeks before the programme concludes, giving them enough time to decide between ending the relationship or transitioning to a private arrangement.',
        'At that point, share your private-practice fee with the client, consent form and confirm you have an independent clinical supervisor in place before continuing to see them.',
        'You must not continue with the Kirana Counselling name or represent yourself as a Kirana trainee once operating privately or after termination of the cohort.',
        'Once the programme ends and your Kirana contract concludes, you may set your own fee for continued private-practice sessions, there is no Kirana-imposed cap.',
        'You are responsible for collecting correct UPI payment details and fees before each session, and for enforcing the cancellation policy already set out in the client\'s consent form.',
        'Kirana Counselling holds no liability for sessions conducted after the programme ends.',
      ] }],
    },
    {
      title: 'Professional Conduct and Ethics',
      blocks: [{ ul: [
        'You are expected to adhere to the APA Ethical Principles of Psychologists and Code of Conduct throughout this programme, including, but not limited to, avoiding harm, maintaining confidentiality, practising within your competence, and obtaining informed consent.',
        'You must not enter into a dual or personal relationship with a client, at any point, the only exception is a private-practice arrangement as described in Section 10, which remains a professional relationship, not a personal one.',
        'Professional discretion, you may use your own judgement to act outside standard protocol only in extreme, clearly safety-relevant situations. This is not a general allowance for deviating from programme rules. Any such instance must be reported to your supervisor within 24hours of the session/contact with the client.',
        'Any ethical concerns, boundary violations, or adverse incidents must be reported to Kirana Counselling immediately.',
      ] }],
    },
    {
      title: 'Reporting Concerns',
      blocks: [{ ul: [
        'If you observe a Kirana Counselling team member not holding professional standards, or behaving unethically, report this to Jai.',
        'If Jai is the one at fault, report it to the other clinical supervisor instead.',
        'Raising a concern in good faith will not affect your standing in the programme.',
      ] }],
    },
    {
      title: 'Attendance and Cancellations',
      blocks: [{ ul: [
        'You are expected to attend all scheduled client sessions.',
        'If you need to cancel or reschedule, notify both the client and Kirana Counselling with a minimum of 24 hours\' advance notice.',
        'Last-minute cancellations (under 24 hours) or repeated, non-emergency, rescheduling will be treated as a breach of this agreement.',
        'Consequences of non-compliance: if Kirana Counselling observes a pattern of last-minute timing changes, we reserve the right to revoke your placement in the programme and withdraw supervisory support with immediate effect.',
      ] }],
    },
    {
      title: 'Accountability and Consequences',
      blocks: [{ ul: [
        'You are personally liable for lapses in your responsibilities under this contract, and will be held proportionally responsible and accountable for them.',
        'Kirana Counselling reserves the right to withhold your completion certificate if standards are not maintained, including, but not limited to: practicing beyond your competence, not submitting assignments on time, or disrespecting professional boundaries.',
      ] }],
    },
    {
      title: 'Liability',
      blocks: [{ ul: [
        'Kirana Counselling provides supervision and training as part of the programme, but you remain personally responsible for your own professional conduct during sessions.',
        'Supervision reduces risk but does not eliminate your personal responsibility for your own actions, decisions, or conduct with a client.',
        'Kirana Counselling is not liable for a trainee\'s misconduct, negligence, or breach of this agreement, and the trainee agrees to indemnify Kirana Counselling against claims arising directly from their own conduct.',
      ] }],
    },
    {
      title: 'Termination From the Programme',
      blocks: [
        { p: 'Kirana Counselling may remove a trainee from the programme, with immediate loss of Drive access and client assignments, on grounds including:' },
        { ul: [
          'Breach of client confidentiality',
          'Violation of professional boundaries described above',
          'Failure to meet practicum or supervision requirements without valid cause',
          'Any conduct that endangers a client\'s safety or wellbeing',
        ] },
        { p: 'If you need to withdraw from the programme mid-cohort, for example due to illness or personal reasons, you are expected to inform both your assigned client(s) and Kirana Counselling as early as possible, following the same professional standards of notice expected elsewhere in this contract. Your clients will then be reassigned to another trainee therapist.' },
      ],
    },
  ],
}

export const CLIENT_CONTRACT: Contract = {
  title: 'Client Contract and Consent Form',
  intro: [
    'Kirana Counselling is a training organisation that helps Master\'s in psychology students and early-career therapists get the supervised, practical experience most academic programmes in India don\'t provide.',
    'Our structured 6-month training programme involves discussions on theory, client practicum, and our aiClients platform (which simulates a client entering therapy) built to let trainees rehearse safely with AI before working with real clients. You can read more about us here: kiranacounselling.com',
  ],
  sections: [
    {
      title: 'The Risks & Benefits of Therapy',
      blocks: [
        { p: 'Therapy enables one to attend to and resolve concerns that they came in with. The therapist and the therapy environment will invite you to verbalize and share your concerns, as per your comfort and in due time, while coming to an eventual shift in perspective. The therapy process involves exploring uncomfortable and distressing feelings such as sadness, anger, frustration, or guilt when sharing your concerns. It may lead you to encounter vulnerable and hidden parts of yourself. But at the same time, it may also lead to a greater understanding of your inner processes and patterns.' },
        { p: 'One of the greatest risks of counseling is that it will not provide an instant cure or easy solution to concerns and is not a cure by itself. However, even when it becomes difficult to bear the discomfort, the trainee therapist will hold space for the discomfort and frustration.' },
      ],
    },
    {
      title: 'Therapist Information',
      blocks: [
        { p: 'Your Trainee Therapist is part of Kirana Counselling\'s 6-month long program. After the first 3 months of training, they are mandated to give Affordable Therapy Sessions to clients, such as yours, under Supervision, for the next three months. Your Trainee Therapist is either pursuing a Master\'s Degree in Psychology or has already completed one.' },
        { p: 'Given their experience, they are not an "expert" at a particular concern, rather after a certain period of rigorous training and assessments, they are now practicing AND learning simultaneously. Just like an MBBS student goes to hospital and college together.' },
      ],
    },
    {
      title: 'What Counselling Is',
      blocks: [
        { p: 'Counselling involves establishing a professional relationship between a therapist and a client to help the client work through emotional distress. It is an active, shared effort between therapist and client.' },
        { p: 'You may experience uncomfortable emotions during this process, sadness, anger, frustration, or guilt. Working through this discomfort is often part of how change happens. Possible benefits include improved personal relationships, reduced emotional distress, and clearer problem-solving.' },
      ],
    },
    {
      title: 'This Is Not a Crisis or Emergency Service',
      blocks: [
        { p: 'Kirana Counselling is not a crisis helpline and does not provide emergency mental health care. Our trainee therapists are early-career therapists (Master\'s students or recent graduates) working under supervision, and this programme is not equipped to handle high-risk cases or situations requiring urgent intervention.' },
        { p: 'If a client\'s needs exceed a trainee therapist\'s competency, or fall outside the scope of this programme, we will redirect the client to an appropriate professional or service.' },
        { p: 'If you are in crisis or facing a mental health emergency, please do not wait for a response from your trainee therapist. Contact your emergency contact person or one of the helplines below immediately.' },
        { p: 'Few Helplines (India)' },
        { ul: [
          'Mpower minds: 1800 120 820050',
          'Vandrevala Foundation: 1860-2662-345 — Available 24/7',
          'iCall WhatsApp: 9152987821',
          'National Emergency: 112',
        ] },
      ],
    },
    {
      title: 'Session Format and Programme Duration',
      blocks: [{ ul: [
        'Duration & Frequency: Sessions run for 45–60 minutes, ideally held once a week at a time that works best for both of you.',
        'The first session is a free 20minute introductory call to evaluate your needs, goals, and objectives together. This session is designed so that you can decide if you would like to work with this trainee therapist or not.',
        'The first 3 sessions are Pro Bono/Free, and fourth session onwards a minimal charge of ₹299 will apply.',
        'This goes entirely towards compensating the trainee therapist for their efforts.',
        'All the sessions are offered as part of a training programme and are available only from September 2026 to November 2026.',
        'If you wish to continue working with your trainee therapist after the programme ends, you are free to do so as a private arrangement between you and them directly. Kirana Counselling will not be involved in that arrangement.',
      ] }],
    },
    {
      title: 'Client Responsibilities',
      blocks: [{ ul: [
        'Attending sessions on time and informing your trainee therapist at least 24 hours in advance if you cannot attend a particular session or a set of sessions.',
        'Being honest about any crisis or risk situations so you can be redirected to appropriate support quickly.',
        'Making a payment (from Session 4 onwards) at least 24 hours before the session, as described in the Payment Policy below.',
        'Informing Kirana Counselling if your emergency contact details change.',
        'Understanding that trainee therapists are still in training, working under supervision(guidance and support by 2 psychologists senior to the trainee), and that this is a learning-oriented engagement for them as well as a support space for you.',
        'You can provide your feedback or reservations about the services to the therapists or inform team Kirana counselling.',
      ] }],
    },
    {
      title: 'Payment Policy',
      blocks: [
        { p: 'The first three sessions are free of cost. From Session 4 onwards, a charge of ₹299 per session applies. This amount goes entirely to the trainee therapist, as compensation for their time.' },
        {
          head: ['Scenario', 'Policy'],
          table: [
            ['No-show (any session)', 'The trainee therapist will wait 10–15 minutes into the scheduled time. After that, it is marked a no-show, unless the client had an emergency they could not have informed us about in advance.'],
            ['No-show in Sessions 1–3 (free sessions)', 'Please note that missed sessions without prior notice (no-shows) will count as one of your three free sessions.'],
            ['Continuing after Session 3', 'Requires a verbal confirmation and payment of ₹299 per session going forward, at least 24 hours before the session. The session is not confirmed until payment is received.'],
            ['Timing of payment', 'Payment must be made at least 24 hours before the scheduled session. Last-minute or same-day payment is not accepted as confirmation.'],
            ['Paid, then no-show', 'Payment is non-refundable. The session is counted as used, and the trainee therapist is compensated for that hour.'],
          ],
        },
      ],
    },
    {
      title: 'Confidentiality',
      blocks: [
        { p: 'Your interactions with your trainee therapist, scheduling, session content, progress, and records, are all kept private and confidential among those directly involved: your trainee therapist, their clinical supervisor(s), and the Kirana Counselling team (which as of now consists of 3 psychologists and one engineer).' },
        { p: 'Limits to Confidentiality' },
        { ul: [
          'Your trainee therapist may discuss your case in clinical supervision for professional and training purposes only.',
          'Supervision is guidance and support by psychologists senior to the trainee. The trainee can choose to discuss parts of the case that they feel they need more support on and the supervisor will guide them on how to work better with clients.',
          'At times, parts of the session may be discussed in the class where your trainee therapist, supervisor and other trainees are present- but your trainee therapist will not share your name and other pieces of information that can reveal your identity.',
          'If there is a clear and imminent danger of harm to yourself or others, your trainee therapist is required to act to ensure your safety and this may mean breaking confidentiality, accordingly. If this happens, we will do our best to inform you about this.',
          'This program is intended exclusively for persons aged 18 and above. In the event that a client is found to be under 18 years of age, applicable Indian laws—including the Protection of Children from Sexual Offences (POCSO) Act, 2012—mandate that we report any disclosed instance of child sexual abuse to the police. This statutory requirement applies regardless of preference and overrides the confidentiality protections outlined in this document.',
          'Everyone with any access to the details about your case, your trainee therapist, their clinical supervisors, Kirana Counselling\'s core team, and any peers present during a supervision or feedback discussion, have signed a Non-Disclosure Agreement specifically covering client confidentiality. This is a signed, legally binding commitment, not an informal understanding.',
        ] },
      ],
    },
    {
      title: 'Video Recording, Data Use, and AI',
      blocks: [
        { p: 'This section explains, in plain terms, what we record, why, what happens to it, and what you are consenting to. Each use below requires your separate, explicit consent at the end of this document, none of it is assumed.' },
        { p: 'Why we ask to record:' },
        { ul: [
          'Since trainee therapists are involved, in order to review parts of their sessions, to maintain quality of services, video recording is important.',
          'Practice is an essential part of training a therapist. It is unfair and possibly harmful if a therapist directly practices on humans and hence Kirana Counselling has developed aiClients.',
          'Our aiClients are AI enabled bots (as of now chat and voice based) simulate the behaviour of a client coming to seek therapy and then our trainees rehearse safely before working with real clients like you. We have been developing these ourselves.',
          'To build this AI based therapist training systems that reflect how therapy actually happens in our Indian context- language, non-verbal cues, and cultural nuance, we need real conversations, Indian therapy session data.',
          'Existing large language models are trained overwhelmingly on Western data and carry socio-cultural biases. Without Indian data, such gaps and biases persist and may fail to operate safely in Indian mental health contexts.',
          'This will eventually help improve therapist training and improve the quality of care available to the public/clients, as we create better aiClients.',
        ] },
        { p: 'What "training AI to improve therapist training" actually means:' },
        { ul: [
          'Recordings of sessions are processed to extract patterns in verbal and non-verbal behaviour- what an Indian person coming to therapy says, how they say it, and how this shifts over the course of a session. This is used to help our systems simulate a realistic client for trainee therapists to practice with, and, in future, to help give trainees structured feedback on their own sessions.',
          'This data will help train and improve aiClients, Kirana Counselling\'s own AI simulation system, built by fine-tuning an existing large language model (not built from scratch). You can see the current platform at http://aiclients.kiranacounselling.com.',
        ] },
        { p: 'Who this is meant to help, and how (The Problem):' },
        { ul: [
          'A large proportion of counselling psychology programmes in India provide little to no practical, supervised training. Trainees who come through Kirana Counselling are often filling that gap. Better-trained therapists, in turn, support the clients they go on to see. Kirana Counselling leads and funds this work, and has both an impact motive and a financial one in doing so, we are stating this plainly rather than leaving it implied.',
          'Our vision is to create a world class Therapist Training Infrastructure in India and in the coming years, become a better alternative to mainstream- theory-only & no-practical classroom education.',
        ] },
        { p: 'What we record and how it is processed:' },
        { ul: [
          'We record video only (not separate audio-only or transcript-only files at the point of capture).',
          'This video is processed by our algorithmic systems to separate out verbal content, non-verbal behaviour, and vocal/speech changes over the course of the session.',
          'All transcriptions remain private through personally identifiable information (PII; eg- names of people, locations, etc) redaction, before it is used for any training purpose.',
          'Sessions are recorded using Fathom. Details about Fathom\'s own policies and compliance management can be found here: https://trust.fathom.video',
          'Fathom does not sell recording data to third parties, and its AI sub-processors are not permitted to use our data to train their own models. Fathom is HIPAA- and GDPR-compliant, with a signed Business Associate Agreement (BAA). We do not opt in to any setting that allows Fathom to use session content for marketing or product improvement.',
          'When we delete the data from Fathom, they delete the recordings and transcriptions as well.',
        ] },
        { p: 'Where and how recordings are stored:' },
        { ul: [
          'During the programme, recordings are stored in an anonymised folder on Kirana Counselling\'s Google Drive.',
          'After the programme, recordings are downloaded onto Kirana Counselling\'s local computer/secured hard drive, and removed from Google Drive.',
          'Raw video recordings are retained for a maximum of 3 years or until extraction is complete, whichever is sooner, after which the video file is permanently erased.',
          'Any additional notes or documentation that are generated by the trainee therapist during your work with them, will be stored with a HIPPA Compliant Third-Party Platform: Serene, https://care.vybz.health. HIPAA compliance is the legally mandated process of safeguarding sensitive patient health data from unauthorized disclosure, access, or theft, in the USA.',
          'In the unfortunate event of a data breach involving your personal information, we will notify you and the Data Protection Board of India promptly, with full details provided within 72 hours of the breach being confirmed.',
          'We do not sell your data to any third party.',
        ] },
        { p: 'Who has access:' },
        { ul: [
          'During the programme: the trainee therapist conducting the session.',
          'After the programme: the trainee therapist no longer has access. Only Kirana Counselling retains access.',
          'Jai Arora, Vanshika Aggrawal, and the clinical supervisors may view parts of a session recording to give feedback to trainees.',
          'A small technical team, one tech lead (a PhD student at IIT-D working on AI and Mental Health) and one transcriber (herself a therapist), handles extracting data from recordings.',
          'All the people involved operate under signed confidentiality agreements. And if in the future, a new person enters the team, they will sign the same agreement as well.',
        ] },
        { p: 'Your consent, and withdrawing it:' },
        { ul: [
          'You may withdraw consent at any time, for any part of this agreement, for example, you can allow supervision use but withdraw aiClient-training use, or withdraw entirely, even after your sessions have ended.',
          'You may have your recordings deleted, at any point.',
          'If we ever want to use your data for a purpose beyond what you consent to below, we will come back to you for fresh, specific consent. Your original consent only covers what you agree to here, it does not automatically extend to new uses in future.',
          'In easy words, what we actually need: it\'s the patterns in how people communicate in an Indian therapeutic context, pacing, language, non-verbal cues. Your name and identity are not necessary or useful to us for this purpose, and thus are removed before any data is used. Facial expressions will be extracted as it is an important part of a person\'s communication.',
        ] },
      ],
    },
    {
      title: 'Liability and Limits of This Agreement',
      blocks: [{ ul: [
        'Kirana Counselling and its trainee therapists provide these sessions on a pro bono or affordable pricing, to the best of their professional ability under supervision.',
        'Kirana Counselling is not a crisis or emergency mental health service. As stated above, situations requiring urgent intervention or exceeding a trainee therapist\'s competency will be redirected to appropriate professionals, this is a limit of the service, not a guarantee of outcome.',
        'To the maximum extent permitted under applicable law, Kirana Counselling, its founder, employees, and affiliated trainee therapists shall not be liable for any indirect, incidental, or consequential damages arising from participation in this programme. Client agrees that their sole remedy for any dispute arising from these services is to raise a complaint through Kirana Counselling\'s stated complaints process, prior to pursuing any other legal action.',
        'Client acknowledges and agrees that any claim arising from this agreement shall be brought against Kirana Counselling as an entity and not against its founder or team members in their personal capacity, except in cases of gross negligence or wilful misconduct.',
      ] }],
    },
    {
      title: 'Termination',
      blocks: [{ ul: [
        'A trainee therapist may end the therapeutic relationship in the event of violence, aggression or misbehaviour toward the trainee therapist.',
        'If the relationship ends for any reason, retained recordings are handled exactly as described in the "Video Recording, Data Use, and AI Training" section above, the same storage, access, and deletion rules apply.',
        'If required, the trainee therapist and Kirana Counselling will help the client with appropriate referrals to other professionals or services as well.',
      ] }],
    },
    {
      title: 'Complaints and Feedback',
      blocks: [
        { p: 'To register a complaint or give feedback about your trainee therapist, please contact Kirana Counselling at kirana.counselling@gmail.com.' },
        { p: 'If you\'re not satisfied with how Kirana Counselling has resolved a data-related complaint, you can escalate it to the Data Protection Board of India, the government body responsible for enforcing the DPDP Act.' },
      ],
    },
  ],
}
