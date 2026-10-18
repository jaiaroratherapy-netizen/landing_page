import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function env(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing environment variable ${name}`)
  return v
}

let service: SupabaseClient | null = null

/** Secret-key client. Bypasses RLS, so only call it after checking the viewer's role. */
export function db() {
  service ??= createClient(env('SUPABASE_URL'), env('SUPABASE_SECRET_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return service
}

/** Cookie-bound client used only for Supabase Auth (sign-in, session, sign-out). */
export async function authClient() {
  const store = await cookies()
  return createServerClient(env('SUPABASE_URL'), env('SUPABASE_PUBLISHABLE_KEY'), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options))
        } catch {
          // called from a Server Component; proxy.ts refreshes the session instead
        }
      },
    },
  })
}
