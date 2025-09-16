// middleware.js (versão aprimorada)
import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // 1. Verifica autenticação
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Rotas que requerem autenticação
  const requiresAuth = [
    '/pedidos-pendentes',
    '/pedidos-aceitos', 
    '/pedidos-entregues',
    '/todos-pedidos',
    '/admin',
    '/gestao-entregadores'
  ];

  // 3. Se não está logado e tenta acessar rota protegida
  if (requiresAuth.includes(req.nextUrl.pathname) && !user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 4. Se está logado e tenta acessar login
  if (req.nextUrl.pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/pedidos-pendentes', req.url));
  }

  // 5. VERIFICAÇÃO DE PERMISSÕES ESPECÍFICAS
  if (user) {
    // Verificar se é admin
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('is_admin')
      .eq('uid', user.id)
      .single();

    // Bloquear entregador de acessar /todos-pedidos
    if (req.nextUrl.pathname === '/todos-pedidos' && !usuario?.is_admin) {
      const { data: lojaData } = await supabase
        .from('loja_associada')
        .select('funcao')
        .eq('uid_usuario', user.id)
        .eq('status_vinculacao', 'ativo')
        .single();

      if (lojaData?.funcao === 'entregador') {
        return NextResponse.redirect(new URL('/pedidos-pendentes', req.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/pedidos-pendentes',
    '/pedidos-aceitos',
    '/pedidos-entregues', 
    '/todos-pedidos',
    '/admin',
    '/gestao-entregadores',
    '/login'
  ],
};