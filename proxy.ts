import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Next.js 16+: renamed from `middleware` to `proxy`
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has('user_session');
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');
  const isRootRoute = request.nextUrl.pathname === '/';

  // 1. Jika user belum login tapi mencoba akses /dashboard, redirect ke root (/)
  if (isDashboardRoute && !hasSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. Jika user SUDAH login tapi mencoba akses halaman login (/), redirect ke dashboard
  if (isRootRoute && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Menentukan rute mana saja yang akan dicegat
export const config = {
  matcher: ['/', '/dashboard/:path*'],
}
