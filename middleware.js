import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Páginas que requerem autenticação
  const protectedRoutes = ['/admin', '/pedidos-pendentes', '/pedidos-aceitos', '/pedidos-entregues', '/orders'];

  // Se não está autenticado e tenta acessar rota protegida
  if (!session && protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Se está autenticado e tenta acessar login/cadastro
  if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/cadastro')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};