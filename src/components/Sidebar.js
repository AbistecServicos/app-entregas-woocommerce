// ========================================
// SIDEBAR.JS - COMPONENTE CORRIGIDO
// ========================================
// Descrição: Sidebar responsivo com menu role-based para app de entregas.
// Problema resolvido: Loop infinito de re-renders via memoização e logs otimizados.
// Manutenção: Seções numeradas para navegação rápida. Remova console.logs em produção.
// Dependências: Next.js, Supabase, hooks custom.
// ========================================

// ===== 1. IMPORTS E PROPS =====
// Importa hooks e componentes necessários.
// Props: Recebe de Layout para dados iniciais (user, lojas).
import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';
import UserProfile from './UserProfile';

const Sidebar = ({ 
  isOpen, 
  toggleSidebar,
  user = null,
  isLoading = false,
  userLojas = []
}) => {
  const router = useRouter();
  
  // Hook para dados completos do perfil (fallback se props falharem).
  const { 
    user: hookUser, 
    userProfile, 
    userRole: hookUserRole, 
    userLojas: hookUserLojas, 
    loading: loadingUser, 
    error 
  } = useUserProfile();
  
  // Estado local para dados "instantâneos" (rápidos, sem await).
  const [instantData, setInstantData] = useState({
    user: null,
    userLojas: [],
    userRole: 'visitante'
  });

  // ===== 2. USEEFFECT: SINCRONIZAR COM PROPS (LOGIN/LOGOUT) =====
  // Atualiza instantData só quando props mudam de verdade (evita loop).
  // Deps: user, userLojas, isLoading (estáveis do parent).
  useEffect(() => {
    console.log('[Sidebar] 🔄 Props atualizadas:', { 
      user: user?.email, 
      lojas: userLojas.length,
      isLoading 
    });

    if (!user) {
      console.log('[Sidebar] 🧹 Limpando dados (logout)');
      setInstantData({ user: null, userLojas: [], userRole: 'visitante' });
      return;
    }

    if (user && !isLoading) {
      console.log('[Sidebar] 🚀 Atualizando dados instantâneos (login)');
      
      // Detecta role baseado em funções das lojas (lógica role-based).
      let instantRole = 'visitante';
      if (userLojas.length > 0) {
        const userFunctions = userLojas.map(loja => loja.funcao);
        console.log('[Sidebar] 🔍 Funções nas lojas:', userFunctions);
        
        if (userFunctions.includes('gerente')) {
          instantRole = 'gerente';
          console.log('[Sidebar] 👑 Role detectada: GERENTE');
        } else if (userFunctions.includes('entregador')) {
          instantRole = 'entregador';
          console.log('[Sidebar] 🚚 Role detectada: ENTREGADOR');
        } else if (userFunctions.includes('admin')) {
          instantRole = 'admin';
          console.log('[Sidebar] ⚙️ Role detectada: ADMIN');
        } else {
          instantRole = 'entregador'; // Fallback para entregador.
          console.log('[Sidebar] 🔀 Função desconhecida, fallback ENTREGADOR');
        }
      }
      
      // Atualiza só se mudou (evita re-render desnecessário).
      const newData = { user, userLojas, userRole: instantRole };
      if (JSON.stringify(newData) !== JSON.stringify(instantData)) {
        setInstantData(newData);
      }
    }
  }, [user, userLojas, isLoading]); // Deps mínimas e estáveis.

  // ===== 3. USEEFFECT: ATUALIZAR COM HOOK (DADOS COMPLETOS) =====
  // Integra dados do hook (ex.: role de perfil carregado async).
  // Deps: hookUser, hookUserRole, loadingUser (do hook, assume estável).
  useEffect(() => {
    if (hookUser && !loadingUser && hookUserRole) {
      console.log('[Sidebar] 📦 Hook role detectada:', hookUserRole);
      // Atualiza role só se diferente (evita loop).
      if (instantData.userRole !== hookUserRole) {
        setInstantData(prev => ({ ...prev, userRole: hookUserRole }));
      }
    }
  }, [hookUser, hookUserRole, loadingUser]);

  // ===== 4. USEMEMO: VARIÁVEIS DE DISPLAY (OTIMIZAÇÃO) =====
  // Computa vars finais só quando deps mudam (previne re-computes em todo render).
  const displayValues = useMemo(() => {
    const displayUser = instantData.user || hookUser;
    const displayUserLojas = instantData.userLojas.length > 0 ? instantData.userLojas : hookUserLojas;
    const displayUserRole = instantData.userRole !== 'visitante' ? instantData.userRole : hookUserRole;
    const displayLoading = (isLoading && !instantData.user) || loadingUser;

    const displayUserProfile = userProfile || (displayUser ? {
      nome_completo: displayUser.user_metadata?.full_name || displayUser.email,
      email: displayUser.email,
      foto: displayUser.user_metadata?.avatar_url,
      nome_usuario: displayUser.user_metadata?.user_name || displayUser.email.split('@')[0],
      telefone: displayUser.user_metadata?.phone || '',
    } : null);

    // Log de estado FINAL só em mudanças (debug otimizado, não em todo render).
    console.log('[Sidebar] 👤 Estado final:', {
      displayUser: displayUser?.email,
      displayUserRole,
      lojas: displayUserLojas.length,
      instantUser: !!instantData.user,
      hookUser: !!hookUser,
      perfil: !!displayUserProfile
    });

    return { displayUser, displayUserLojas, displayUserRole, displayLoading, displayUserProfile };
  }, [instantData, hookUser, hookUserRole, hookUserLojas, userProfile, isLoading, loadingUser]);

  const { displayUser, displayUserLojas, displayUserRole, displayLoading, displayUserProfile } = displayValues;

  // ===== 5. ITENS FIXOS DO MENU =====
  // Define itens básicos do menu (comuns a todos roles).
  const homeItem = { path: '/', icon: '🏠', label: 'EntregasWoo' };
  const vendasWooItem = { path: '/vendaswoo', icon: '🛍️', label: 'VendasWoo' };
  const perfilItem = { path: '/perfil', icon: '👤', label: 'Meu Perfil' };
  const pendentesItem = { path: '/pedidos-pendentes', icon: '📋', label: 'Pedidos Pendentes' };
  const aceitosItem = { path: '/pedidos-aceitos', icon: '✅', label: 'Pedidos Aceitos' };
  const entreguesItem = { path: '/pedidos-entregues', icon: '🚚', label: 'Pedidos Entregues' };
  const gestaoItem = { path: '/gestao-entregadores', icon: '👥', label: 'Gestão de Entregadores' };
  const todosItem = { path: '/todos-pedidos', icon: '📊', label: 'Todos os Pedidos' };
  const relatoriosItem = { path: '/relatorios', icon: '📈', label: 'Relatórios' };
  const adminItem = { path: '/admin', icon: '⚙️', label: 'Administração' };

// ===== 6. USEMEMO: MONTAGEM DO MENU (BASEADO EM ROLE) =====
// Monta menu condicional só quando role/lojas mudam (otimização).
const menuItems = useMemo(() => {
  // 🔥 CORREÇÃO: Itens públicos (só mostram para visitantes ou usuários sem loja)
  const publicItems = [
    { path: '/', icon: '🏠', label: 'EntregasWoo' },
    { path: '/vendaswoo', icon: '🛍️', label: 'VendasWoo' }
  ];

  // Se não tem usuário logado, mostra apenas itens públicos
  if (!displayUser) {
    console.log('[Sidebar] 🔐 Menu: apenas itens públicos (usuário não logado)');
    return publicItems;
  }

  // 🔥 CORREÇÃO: Se usuário está logado MAS não tem lojas associadas, mostra públicos + perfil
  if (displayUserLojas.length === 0 && displayUserRole === 'visitante') {
    console.log('[Sidebar] 🔐 Menu: usuário logado sem lojas - mostra públicos');
    return [...publicItems, perfilItem];
  }

  // 🔥 CORREÇÃO: Se usuário tem role de entregador, gerente ou admin, NÃO mostra páginas públicas
  console.log('[Sidebar] 🔐 Menu: carregando para role', displayUserRole);
  const userItems = [perfilItem];

  // Lógica role-based: Adiciona itens por permissão.
  if (['entregador', 'gerente', 'admin'].includes(displayUserRole)) {
    userItems.push(pendentesItem);
  }
  if (displayUserRole === 'entregador') {
    userItems.push(aceitosItem);
  }
  if (['entregador', 'gerente', 'admin'].includes(displayUserRole)) {
    userItems.push(entreguesItem);
  }
  if (displayUserLojas.length > 0 || displayUserRole === 'admin') {
    userItems.push(relatoriosItem);
  }
  if (['gerente', 'admin'].includes(displayUserRole)) {
    userItems.push(gestaoItem, todosItem);
  }
  if (displayUserRole === 'admin') {
    userItems.push(adminItem);
  }

  console.log('[Sidebar] 📋 Menu final (SEM páginas públicas):', userItems.map(i => i.label));
  
  // 🔥 CORREÇÃO: Retorna apenas userItems (NÃO inclui publicItems)
  return userItems;
}, [displayUser, displayUserRole, displayUserLojas.length]); // Deps: só o essencial.
  // ===== 7. HANDLERS (USECALLBACK PARA ESTABILIDADE) =====
  // Logout: Limpa state local + Supabase auth + redirect.
  const handleLogout = useCallback(async () => {
    try {
      console.log('[Sidebar] 🚪 Logout iniciado');
      if (window.innerWidth < 1024) toggleSidebar(); // Fecha mobile.
      setInstantData({ user: null, userLojas: [], userRole: 'visitante' }); // Limpa instantâneo.
      await router.push('/'); // Redirect home.
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('[Sidebar] ✅ Logout concluído');
    } catch (error) {
      console.error('[Sidebar] ❌ Erro no logout:', error);
    }
  }, [toggleSidebar, router]);

  // Redirect para login.
  const handleLoginRedirect = useCallback(() => {
    if (window.innerWidth < 1024) toggleSidebar();
    router.push('/login');
  }, [toggleSidebar, router]);

  // Fecha sidebar mobile ao clicar em item.
  const handleMenuItemClick = useCallback(() => {
    if (window.innerWidth < 1024) toggleSidebar();
  }, [toggleSidebar]);

  // ===== 8. RENDER (JSX) =====
  // Renderiza overlay mobile + sidebar com logo, menu e perfil.
  return (
    <>
      {/* Overlay para mobile (fecha ao clicar fora). */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar principal (fixed em mobile, static em desktop). */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-purple-800 text-white
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col h-full
      `}>
        {/* Seção Logo (link para home). */}
        <div className="p-4 border-b border-purple-700">
          <Link href="/" passHref onClick={handleMenuItemClick}>
            <div className="cursor-pointer flex justify-center">
              <img 
                src="https://czzidhzzpqegfvvmdgno.supabase.co/storage/v1/object/public/box/logos/logo_entregaswoo_600x240_branco.png"
                alt="EntregasWoo"
                className="h-20 w-auto object-contain"
              />
            </div>
            <p className="text-purple-300 text-sm mt-2 text-center">Sistema de Gestão</p>
          </Link>
        </div>

        {/* Seção Menu (itens role-based, com active state). */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center py-3 px-4 rounded-lg mb-2 transition-colors
                ${router.pathname === item.path
                  ? 'bg-purple-900 text-white shadow-md'
                  : 'hover:bg-purple-700 text-purple-200'
                }`}
              onClick={handleMenuItemClick}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Seção Perfil (UserProfile com loading e ações). */}
        <div className="mt-auto border-t border-purple-700">
          <UserProfile 
            user={displayUserProfile}
            loading={displayLoading}
            showLogout={!!displayUser}
            onLogout={handleLogout}
            onLogin={handleLoginRedirect}
          />
        </div>
      </div>
    </>
  );
};

export default Sidebar;