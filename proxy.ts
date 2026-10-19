import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Keeps the Supabase session cookie fresh on app pages. Role checks happen in the pages themselves.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })
  // refreshes an expired session; the token is verified locally with the project's signing keys (no network call)
  await supabase.auth.getClaims()
  return response
}

export const config = {
  matcher: ['/admin/:path*', '/trainee/:path*', '/client/:path*', '/dashboard', '/join/:path*', '/login', '/therapists/:path*', '/book/:path*'],
}
