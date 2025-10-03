// ========================================
// SIDEBAR.JS - COMPONENTE OTIMIZADO
// ========================================
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';
import UserProfile from './UserProfile';
import React from 'react';

const Sidebar = ({ 
  isOpen, 
  toggleSidebar,
  user = null,
  isLoading = false,
  userLojas = []
}) => {
  const router = useRouter();
  
  // ✅ OTIMIZAÇÃO: useRef para prevenir updates desnecessários
  const previousDataRef = useRef({
    user: null,
    userLojas: [],
    userRole: 'visitante'
  });

  // Hook para dados completos do perfil
  const { 
    user: hookUser, 
    userProfile, 
    userRole: hookUserRole, 
    userLojas: hookUserLojas, 
    loading: loadingUser
  } = useUserProfile();
  
  // Estado local para dados "instantâneos"
  const [instantData, setInstantData] = useState({
    user: null,
    userLojas: [],
    userRole: 'visitante'
  });

  // ===== 1. USEEFFECT OTIMIZADO: SINCRONIZAR COM PROPS =====
  useEffect(() => {
    // ✅ OTIMIZAÇÃO: Comparação profunda com referência anterior
    const userChanged = user?.email !== previousDataRef.current.user?.email;
    const lojasChanged = JSON.stringify(userLojas) !== JSON.stringify(previousDataRef.current.userLojas);
    const loadingChanged = isLoading !== previousDataRef.current.isLoading;

    if (!userChanged && !lojasChanged && !loadingChanged) {
      return; // ✅ Nada mudou, evita re-render
    }

    if (!user) {
      if (previousDataRef.current.user) {
        console.log('[Sidebar] 🧹 Limpando dados (logout)');
        setInstantData({ user: null, userLojas: [], userRole: 'visitante' });
      }
    } else if (user && !isLoading) {
      // ✅ OTIMIZAÇÃO: Só calcula role se necessário
      let instantRole = 'visitante';
      if (userLojas.length > 0) {
        const userFunctions = userLojas.map(loja => loja.funcao);
        
        if (userFunctions.includes('admin')) {
          instantRole = 'admin';
        } else if (userFunctions.includes('gerente')) {
          instantRole = 'gerente';
        } else if (userFunctions.includes('entregador')) {
          instantRole = 'entregador';
        }
      }

      const newData = { user, userLojas, userRole: instantRole };
      
      // ✅ OTIMIZAÇÃO: Só atualiza se dados realmente mudaram
      if (JSON.stringify(newData) !== JSON.stringify(instantData)) {
        console.log('[Sidebar] 🚀 Atualizando dados instantâneos');
        setInstantData(newData);
      }
    }

    // ✅ ATUALIZA REF para próxima comparação
    previousDataRef.current = {
      user,
      userLojas,
      userRole: instantData.userRole,
      isLoading
    };
  }, [user, userLojas, isLoading, instantData]);

  // ===== 2. USEEFFECT: SINCRONIZAR COM HOOK USERPROFILE =====
  useEffect(() => {
    if (hookUser && !loadingUser && hookUserRole) {
      // ✅ OTIMIZAÇÃO: Só atualiza se role mudou significativamente
      if (instantData.userRole !== hookUserRole && hookUserRole !== 'visitante') {
        console.log('[Sidebar] 📦 Atualizando role do hook:', hookUserRole);
        setInstantData(prev => ({ ...prev, userRole: hookUserRole }));
      }
    }
  }, [hookUser, hookUserRole, loadingUser, instantData.userRole]);

  // ===== 3. USEMEMO OTIMIZADO: VARIÁVEIS DE DISPLAY =====
  const displayValues = useMemo(() => {
    const displayUser = instantData.user || hookUser;
    const displayUserLojas = instantData.userLojas.length > 0 ? instantData.userLojas : hookUserLojas;
    const displayUserRole = instantData.userRole !== 'visitante' ? instantData.userRole : (hookUserRole || 'visitante');
    const displayLoading = (isLoading && !instantData.user) || loadingUser;

    const displayUserProfile = userProfile || (displayUser ? {
      nome_completo: displayUser.user_metadata?.full_name || displayUser.email,
      email: displayUser.email,
      foto: displayUser.user_metadata?.avatar_url,
      nome_usuario: displayUser.user_metadata?.user_name || displayUser.email.split('@')[0],
      telefone: displayUser.user_metadata?.phone || '',
    } : null);

    // ✅ OTIMIZAÇÃO: Log reduzido apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('[Sidebar] 👤 Estado final:', {
        user: displayUser?.email,
        role: displayUserRole,
        lojas: displayUserLojas.length
      });
    }

    return { 
      displayUser, 
      displayUserLojas, 
      displayUserRole, 
      displayLoading, 
      displayUserProfile 
    };
  }, [
    instantData.user, 
    instantData.userLojas, 
    instantData.userRole, 
    hookUser, 
    hookUserLojas, 
    hookUserRole, 
    userProfile, 
    isLoading, 
    loadingUser
  ]);

  const { displayUser, displayUserLojas, displayUserRole, displayLoading, displayUserProfile } = displayValues;

  // ===== 4. USEMEMO: ITENS DO MENU (OTIMIZADO) =====
  const menuItems = useMemo(() => {
    // Itens públicos
    const publicItems = [
      { path: '/', icon: '🏠', label: 'EntregasWoo' },
      { path: '/vendaswoo', icon: '🛍️', label: 'VendasWoo' }
    ];

    // Usuário não logado
    if (!displayUser) {
      return publicItems;
    }

    // Usuário logado sem lojas
    if (displayUserLojas.length === 0 && displayUserRole === 'visitante') {
      return [...publicItems, { path: '/perfil', icon: '👤', label: 'Meu Perfil' }];
    }

    // ✅ OTIMIZAÇÃO: Construção eficiente do menu baseado na role
    const userItems = [{ path: '/perfil', icon: '👤', label: 'Meu Perfil' }];

    // Menu base para todos os roles autenticados
    if (['entregador', 'gerente', 'admin'].includes(displayUserRole)) {
      userItems.push(
        { path: '/pedidos-pendentes', icon: '📋', label: 'Pedidos Pendentes' },
        { path: '/pedidos-entregues', icon: '🚚', label: 'Pedidos Entregues' }
      );
    }

    // Itens específicos por role
    if (displayUserRole === 'entregador') {
      userItems.push({ path: '/pedidos-aceitos', icon: '✅', label: 'Pedidos Aceitos' });
    }

    if (displayUserLojas.length > 0 || displayUserRole === 'admin') {
      userItems.push({ path: '/relatorios', icon: '📈', label: 'Relatórios' });
    }

    if (['gerente', 'admin'].includes(displayUserRole)) {
      userItems.push(
        { path: '/gestao-entregadores', icon: '👥', label: 'Gestão de Entregadores' },
        { path: '/todos-pedidos', icon: '📊', label: 'Todos os Pedidos' }
      );
    }

    if (displayUserRole === 'admin') {
      userItems.push({ path: '/admin', icon: '⚙️', label: 'Administração' });
    }

    return userItems;
  }, [displayUser, displayUserRole, displayUserLojas.length]);

  // ===== 5. HANDLERS OTIMIZADOS COM USECALLBACK =====
  const handleMenuItemClick = useCallback(() => {
    if (window.innerWidth < 1024) {
      toggleSidebar();
    }
  }, [toggleSidebar]);

  const handleLogout = useCallback(async () => {
    try {
      console.log('[Sidebar] 🚪 Logout iniciado');
      if (window.innerWidth < 1024) toggleSidebar();
      
      setInstantData({ user: null, userLojas: [], userRole: 'visitante' });
      await supabase.auth.signOut();
      await router.push('/');
      
      console.log('[Sidebar] ✅ Logout concluído');
    } catch (error) {
      console.error('[Sidebar] ❌ Erro no logout:', error);
    }
  }, [toggleSidebar, router]);

  const handleLoginRedirect = useCallback(() => {
    if (window.innerWidth < 1024) toggleSidebar();
    router.push('/login');
  }, [toggleSidebar, router]);

  // ===== 6. RENDER OTIMIZADO =====
  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar principal */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-purple-800 text-white
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col h-full
      `}>
        {/* Logo */}
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

        {/* Menu */}
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

        {/* Perfil */}
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

// ✅ OTIMIZAÇÃO FINAL: React.memo para prevenir re-renders desnecessários
export default React.memo(Sidebar);