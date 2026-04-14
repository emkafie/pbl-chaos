import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Menggunakan server-side Next.js Middleware (berjalan di Edge Runtime)
export function middleware(request: NextRequest) {
  // Mengecek apakah cookie 'user_session' ada (yang diset saat login)
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

  // Lanjut seperti biasa jika tidak ada masalah
  return NextResponse.next();
}

// Menentukan rute mana saja yang akan dicegat oleh middleware ini
export const config = {
  matcher: ['/', '/dashboard/:path*'], // Middleware akan menyala jika url adalah / atau diawali dengan /dashboard
}
