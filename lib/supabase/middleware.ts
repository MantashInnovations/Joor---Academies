import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // SECURITY: Must call getUser() — protects against CVE-2025-29927 session injection
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isProtectedPath = pathname.startsWith('/admin') || pathname.startsWith('/teacher') || pathname.startsWith('/student')

  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isProtectedPath) {
    // FAST PATH: role is in app_metadata (set server-side, cryptographically verified in JWT)
    // This is the common case — no DB round-trip needed
    let role = (user.app_metadata?.role || '').toLowerCase()

    // SLOW PATH: JWT missing role — query DB as fallback (legacy users only)
    if (!role) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .single()

      if (profile?.is_active === false) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('error', 'Account deactivated. Contact your administrator.')
        return NextResponse.redirect(url)
      }
      role = (profile?.role || '').toLowerCase()
    }

    // Normalize legacy role names
    if (role === 'academy') role = 'academy_admin'
    if (role === 'superuser') role = 'super_admin'

    // Route guards
    if (pathname.startsWith('/admin') && role !== 'academy_admin' && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    if (pathname.startsWith('/teacher') && role !== 'teacher') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    if (pathname.startsWith('/student') && role !== 'student') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}
