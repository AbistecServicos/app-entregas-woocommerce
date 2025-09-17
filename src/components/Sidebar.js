// components/Sidebar.js
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';
import UserProfile from './UserProfile';

// ==============================================================================
// COMPONENTE SIDEBAR - MENU LATERAL
// ==============================================================================
/**
 * Sidebar é o menu de navegação lateral do sistema.
 * Contém: Logo, Menu de navegação, Perfil do usuário e Botão de login/logout.
 * Responsivo: Mobile (overlay) e Desktop (fixo).
 * Integra com useUserProfile para gerenciar autenticação.
 */
const Sidebar = ({ isOpen, toggleSidebar }) => {
  const router = useRouter();
  const { user, userRole, loading: loadingUser } = useUserProfile();
  
  // ============================================================================
  // 1. ITENS DO MENU COM RESTRIÇÃO DE ACESSO
  // ============================================================================
  /**
   * Itens base do menu, visíveis para todos os usuários logados.
   */
  const baseItems = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/pedidos-pendentes', icon: '📋', label: 'Pedidos Pendentes' },
    { path: '/pedidos-aceitos', icon: '✅', label: 'Pedidos Aceitos' },
    { path: '/pedidos-entregues', icon: '🚚', label: 'Pedidos Entregues' },
    { path: '/gestao-entregadores', icon: '👥', label: 'Gestão de Entregadores' },
    { path: '/perfil', icon: '👤', label: 'Meu Perfil' },
  ];

  /**
   * Itens administrativos, visíveis apenas para gerentes e administradores.
   */
  const adminItems = [
    { path: '/todos-pedidos', icon: '📊', label: 'Todos os Pedidos' },
    { path: '/relatorios', icon: '📈', label: 'Relatórios' },
    { path: '/admin', icon: '⚙️', label: 'Administração' },
  ];

  /**
   * Combina itens conforme a role do usuário.
   */
  const menuItems = [
    ...baseItems,
    ...((userRole === 'admin' || userRole === 'gerente') ? adminItems : [])
  ];

  // ============================================================================
  // 2. FUNÇÃO: LOGOUT DO USUÁRIO
  // ============================================================================
  /**
   * Realiza o logout do usuário via Supabase.
   * O useUserProfile lida com a atualização dos estados e redirecionamento.
   */
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
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // ============================================================================
  // 3. FUNÇÃO: REDIRECIONAR PARA LOGIN
  // ============================================================================
  /**
   * Redireciona para a página de login quando o usuário não está autenticado.
   */
  const handleLoginRedirect = () => {
    if (window.innerWidth < 1024) {
      toggleSidebar();
    }
    router.push('/login');
  };

  // ============================================================================
  // 4. FUNÇÃO: FECHAR SIDEBAR AO CLICAR EM ITEM (MOBILE)
  // ============================================================================
  /**
   * Fecha o sidebar no mobile quando um item de menu é clicado.
   */
  const handleMenuItemClick = () => {
    if (window.innerWidth < 1024) {
      toggleSidebar();
    }
  };

  // ============================================================================
  // 5. RENDERIZAÇÃO DO COMPONENTE
  // ============================================================================
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
            <UserProfile />
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