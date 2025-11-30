import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_TOKEN_COOKIE } from './lib/constants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  const userRole = request.cookies.get('user_role')?.value;
  const companyStatus = request.cookies.get('company_status')?.value;

  const isAdminRoute = pathname.startsWith('/admin');
  const isAgentRoute = pathname.startsWith('/guide');
  const isAuthRoute = ['/login', '/register', '/register/user', '/register/agent'].includes(pathname);

  if (isAdminRoute && pathname !== '/admin/login' && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  if (pathname === '/admin/login' && userRole === 'admin') {
     return NextResponse.redirect(new URL('/admin', request.url));
  }

  if (isAgentRoute) {
    if (userRole !== 'agent') {
        return NextResponse.redirect(new URL('/login', request.url));
    }
    if (companyStatus && companyStatus !== 'active') {
        return NextResponse.redirect(new URL('/guide/pending', request.url));
    }
  }

  if (isAuthRoute && token) {
      if (userRole === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
      if (userRole === 'agent') return NextResponse.redirect(new URL('/guide', request.url));
      return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|guide/pending).*)',
  ],
};
