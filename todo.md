I need to make a therapist and client management EHR as well as a LMS system webapp. need to use the current vercel setup as my domain is also from vercel. Use vercel functions to perform everything. Use supabase for every form, data and logins. So the software will have 3 roles: Instructor(superadmin), Trainees(therapists) and Clients(patients). 

Admin:
1) should onboard people and have access to see very detailed and visual analysis of everything happening in the system.
2) Can manage cohorts(can assign which cohort the trainee is from and onboard Trainees.
3) while onboarding, send a customized(unique link) onboarding and consent form for the trainee. The trainee logs in with a google account and continues the form filing. The form contains: “Date,Please share your emergency contact and mention the name as well.,I confirm that I am 18 or above years in age,I understand that I can withdraw consent at any time, for any part of this agreement just by emailing kirana.counselling@gmail.com,I consent to the contents of the sessions being shared with clinical supervisors and other trainees for supervision purposes, without my name and other identifiers,I consent to video recording of my sessions for clinical supervision and to ensure the quality of the service delivered,I consent to my (anonymised, personal information removed) session recordings being used to improve Kirana Counselling's aiClients platform, to help train future therapists.,I understand the first three sessions are free, and from Session 4 onward a ₹299 per-session charge applies, paid entirely to the trainee therapist.,I understand these services are offered only from September 2026 to November 2026, and Kirana Counselling is not involved in any arrangement beyond this period.,I have read and understood all terms of this contract.,Type your full name as your electronic signature”
4) and control and edit trainee profiles.
5) can see a list of Clients who are onboarded, and assign clients to trainees. recreate therapy.html for the onboarding.
6) can manage money, First 3 sessions free for each patient, then ₹299 per session. So can see how much they need to pay them.

Trainee:
1) can login with registered email as onboarding form, modify their profile,
2) can see assigned patients, can send the patients a customized(unique link) “consent form”. The consent form contains: “Date, Please share your emergency contact and mention the name as well.,I confirm that I am 18 or above years in age,I understand that I can withdraw consent at any time, for any part of this agreement just by emailing kirana.counselling@gmail.com,I consent to the contents of the sessions being shared with clinical supervisors and other trainees for supervision purposes, without my name and other identifiers,I consent to video recording of my sessions for clinical supervision and to ensure the quality of the service delivered,I consent to my (anonymised, personal information removed) session recordings being used to improve Kirana Counselling's aiClients platform, to help train future therapists.,I understand the first three sessions are free, and from Session 4 onward a ₹299 per-session charge applies, paid entirely to the trainee therapist.,I understand these services are offered only from September 2026 to November 2026, and Kirana Counselling is not involved in any arrangement beyond this period.,I have read and understood all terms of this contract.,Type your full name as your electronic signature”
3) can visit patient profiles and fill these fields “Took intro call?,Took first session?,First session feedback,How many sessions took?,If DO, reason? and after how many sessions,overall feedback,Shifting to private practice or not? If yes, Price?”
4) can see the client's bookings, manage, reschedule, cancel etc.
5) Can see patient’s consent form and in two boxes in short: Consent fields the client said YES to, Consent fields the client said NO to
6) can see earnings and multiple visualizations in the dashboard.
7) Therapist can fill feedback after each and every sessions(only admin can see that), form contains: “How was your experience of taking Pro-bono sessions with Kirana?,Are your clients continuing with you? Mention name, what will you be charging and did they agree or not,If you were to tell us something this One Month Pro-bono training did well, what would that be? Eg- Jai watching videos etc,What can we improve upon? Eg- need a more experienced supervisor, the process was rushed etc,Anything else left on your mind?,Even if one client wants to continue with you, have you found an external supervisor yet?,Have you made a new consent form that you will ask them to sign? It should have the money aspect, cancellation policies etc.,How many clients did you have (write names) and how many sessions did you have with each?”


Clients:
1) can login with the registered email, modify their profile.
2) can see scheduled meetings
3) can manage bookings, reschedule, cancel etc.
4) Client can fill client feedback form after each session ends “How was your experience with the therapist?,Was there any point when your therapist made you feel uncomfortable (bad questions, facial expressions, tone etc)? If yes, please share that instance. This helps them improve.,As an organization, anything else we could have done to make the process easier for you? Eg- therapist should be assigned faster, need better quality etc,Anything else left on your mind?,Did the presence of the video recorder bother you?,What was one thing that the therapist did well?”, both admin and therapist can see that.




make /privacy and /terms page for google auth verification.