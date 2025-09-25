// components/Sidebar.js
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';
import UserProfile from './UserProfile';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const router = useRouter();
  const { user, userProfile, userRole, userLojas, loading: loadingUser, error } = useUserProfile();
  
  // Itens do menu (mantido igual)
  const homeItem = { path: '/', icon: '🏠', label: 'Home' };
  const perfilItem = { path: '/perfil', icon: '👤', label: 'Meu Perfil' };
  const pendentesItem = { path: '/pedidos-pendentes', icon: '📋', label: 'Pedidos Pendentes' };
  const aceitosItem = { path: '/pedidos-aceitos', icon: '✅', label: 'Pedidos Aceitos' };
  const entreguesItem = { path: '/pedidos-entregues', icon: '🚚', label: 'Pedidos Entregues' };
  const gestaoItem = { path: '/gestao-entregadores', icon: '👥', label: 'Gestão de Entregadores' };
  const todosItem = { path: '/todos-pedidos', icon: '📊', label: 'Todos os Pedidos' };
  const relatoriosItem = { path: '/relatorios', icon: '📈', label: 'Relatórios' };
  const adminItem = { path: '/admin', icon: '⚙️', label: 'Administração' };

  // Montagem condicional dos itens (mantido igual)
  let menuItems = [homeItem];

  if (user) {
    menuItems.push(perfilItem);

    if (userRole === 'entregador') {
      menuItems.push(pendentesItem, aceitosItem);
    }

    if (['entregador', 'gerente', 'admin'].includes(userRole)) {
      menuItems.push(entreguesItem);
    }

    if (userLojas.length > 0 || userRole === 'admin') {
      menuItems.push(relatoriosItem);
    }

    if (['gerente', 'admin'].includes(userRole)) {
      menuItems.push(gestaoItem, todosItem);
    }

    if (userRole === 'admin') {
      menuItems.push(adminItem);
    }
  }

  // ============================================================================
  // FUNÇÃO DE LOGOUT CORRIGIDA
  // ============================================================================
  const handleLogout = async () => {
    try {
      // Fechar sidebar no mobile antes do logout
      if (window.innerWidth < 1024) {
        toggleSidebar();
      }
      
      // Realizar logout
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log('Logout realizado com sucesso');
      
      // 🎯 CORREÇÃO: REDIRECIONAR PARA PÁGINA INICIAL
      router.push('/');
      
      // 🎯 CORREÇÃO: FORÇAR ATUALIZAÇÃO DO MENU
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Funções auxiliares (mantidas iguais)
  const handleLoginRedirect = () => {
    if (window.innerWidth < 1024) {
      toggleSidebar();
    }
    router.push('/login');
  };

  const handleMenuItemClick = () => {
    if (window.innerWidth < 1024) {
      toggleSidebar();
    }
  };

  // Renderização (mantida igual)
  return (
    <>
      {/* Overlay para mobile */}
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
        {/* Logo / Marca do sistema */}
        <div className="p-6 border-b border-purple-700">
          <Link href="/" passHref onClick={handleMenuItemClick}>
            <div className="cursor-pointer">
              <h1 className="text-2xl font-bold">EntregasWoo</h1>
              <p className="text-purple-300 text-sm">Sistema de Gestão</p>
            </div>
          </Link>
        </div>

        {/* Menu de navegação */}
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

        {/* Perfil do usuário (condicional) */}
        {user && (
          <div className="p-4 border-t border-purple-700 bg-purple-900">
            <UserProfile 
              userProfile={userProfile} 
              userRole={userRole} 
              loading={loadingUser}
              error={error}
            />
          </div>
        )}

        {/* Botão dinâmico: Entrar/Sair */}
        <div className="p-4 border-t border-purple-700">
          {user ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center py-2 px-4 bg-purple-700 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair
            </button>
          ) : (
            <button
              onClick={handleLoginRedirect}
              className="w-full flex items-center justify-center py-2 px-4 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l-4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Entrar
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;