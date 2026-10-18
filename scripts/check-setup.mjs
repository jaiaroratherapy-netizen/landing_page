// npm run check: is .env complete, is the schema in Supabase, is the data locked down?
import { createClient } from '@supabase/supabase-js'

const need = ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY']
const missing = need.filter((k) => !process.env[k])
if (missing.length) { console.log('✗ .env is missing:', missing.join(', ')); process.exit(1) }
console.log('✓ .env has the Supabase keys')
console.log(process.env.ADMIN_EMAILS ? `✓ admins: ${process.env.ADMIN_EMAILS}` : '• ADMIN_EMAILS not set, so only kirana.counselling@gmail.com is an admin')

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } })
const tables = ['cohorts', 'trainees', 'clients', 'invites', 'consents', 'sessions', 'client_tracking', 'trainee_feedback', 'client_feedback', 'payouts', 'activity']
let ok = true
for (const t of tables) {
  const { error } = await sb.from(t).select('*').limit(1)
  if (error) { ok = false; console.log(`✗ table ${t}: ${error.code === 'PGRST205' ? 'missing' : error.message}`) }
}
if (ok) console.log('✓ all tables exist')
else console.log('  → run supabase/schema.sql in Supabase → SQL Editor')

const anon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY)
const { data } = await anon.from('clients').select('id').limit(1)
console.log(data?.length ? '✗ the publishable key can read client data. Re-run schema.sql' : '✓ public key cannot read data')
process.exit(ok ? 0 : 1)
