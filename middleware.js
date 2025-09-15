// middleware.js (versão simplificada)
import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // 1. Verifica se usuário está autenticado
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Lista de rotas que requerem login
  const requiresAuth = [
    '/pedidos-pendentes',
    '/pedidos-aceitos', 
    '/pedidos-entregues',
    '/todos-pedidos',
    '/admin'
  ];

  // 3. Se rota requer auth e usuário não está logado → redireciona
  if (requiresAuth.includes(req.nextUrl.pathname) && !user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 4. Se usuário logado tenta acessar login → redireciona para dashboard
  if (req.nextUrl.pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/pedidos-pendentes', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/pedidos-pendentes', '/pedidos-aceitos', '/pedidos-entregues', '/todos-pedidos', '/admin', '/login'],
};