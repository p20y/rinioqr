import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Check for Supabase session cookie
  const token = req.cookies.get('sb-access-token')?.value ||
                req.cookies.get('sb-localhost-auth-token')?.value

  const hasSession = !!token

  // Define protected routes that require authentication
  const protectedRoutes = ['/seller', '/dashboard', '/settings', '/billing', '/analytics']
  const authRoutes = ['/login', '/signup']

  const isProtectedRoute = protectedRoutes.some(route =>
    req.nextUrl.pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some(route =>
    req.nextUrl.pathname.startsWith(route)
  )
  const isPrintRoute = req.nextUrl.pathname.startsWith('/print/')

  // Redirect unauthenticated users trying to access protected routes
  if (isProtectedRoute && !hasSession) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users trying to access auth routes
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL('/seller', req.url))
  }

  // Protect print routes (require authentication)
  if (isPrintRoute && !hasSession) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    '/seller/:path*',
    '/dashboard/:path*',
    '/settings/:path*',
    '/billing/:path*',
    '/analytics/:path*',
    '/print/:path*',
    '/login',
    '/signup'
  ],
}
