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
 * Integra com useUserProfile para gerenciar autenticação e visibilidade de menus.
 */
const Sidebar = ({ isOpen, toggleSidebar }) => {
  const router = useRouter();
  const { user, userRole, userLojas, loading: loadingUser } = useUserProfile();
  
  // ============================================================================
  // 1. DEFINIÇÃO DOS ITENS DO MENU (INDIVIDUAIS)
  // ============================================================================
  /**
   * Definimos cada item separadamente para facilitar a montagem condicional.
   * Cada item tem: path (rota), icon (emoji), label (texto).
   */
  const homeItem = { path: '/', icon: '🏠', label: 'Home' };
  const perfilItem = { path: '/perfil', icon: '👤', label: 'Meu Perfil' };
  const pendentesItem = { path: '/pedidos-pendentes', icon: '📋', label: 'Pedidos Pendentes' };
  const aceitosItem = { path: '/pedidos-aceitos', icon: '✅', label: 'Pedidos Aceitos' };
  const entreguesItem = { path: '/pedidos-entregues', icon: '🚚', label: 'Pedidos Entregues' };
  const gestaoItem = { path: '/gestao-entregadores', icon: '👥', label: 'Gestão de Entregadores' };
  const todosItem = { path: '/todos-pedidos', icon: '📊', label: 'Todos os Pedidos' };
  const relatoriosItem = { path: '/relatorios', icon: '📈', label: 'Relatórios' };
  const adminItem = { path: '/admin', icon: '⚙️', label: 'Administração' };

  // ============================================================================
  // 2. MONTAGEM CONDICIONAL DOS ITENS DO MENU (CORRIGIDA)
  // ============================================================================
  /**
   * Constrói a lista de menuItems dinamicamente com base no user e userRole.
   * - Sempre inclui 'Home'.
   * - Para logados: Adiciona 'Meu Perfil'.
   * - Para 'entregador': Adiciona menus de pedidos pendentes e aceitos.
   * - Para 'entregador', 'gerente' e 'admin': Adiciona pedidos entregues.
   * - Para associados à loja (userLojas.length > 0) ou admin: Adiciona 'Relatórios'.
   * - Para 'gerente' ou 'admin': Adiciona gestão e todos os pedidos.
   * - Para 'admin': Adiciona administração.
   * 
   * ✅ CORREÇÃO: Pedidos Pendentes e Aceitos são APENAS para entregadores.
   */
  let menuItems = [homeItem]; // Sempre visível (até para não logados)

  if (user) { // Apenas para usuários logados
    menuItems.push(perfilItem);

    // --------------------------------------------------------------------------
    // BLOCO A: ITENS DE PEDIDOS PENDENTES E ACEITOS (APENAS ENTREGADORES)
    // --------------------------------------------------------------------------
    if (userRole === 'entregador') {
      menuItems.push(pendentesItem, aceitosItem);
    }

    // --------------------------------------------------------------------------
    // BLOCO B: ITENS DE PEDIDOS ENTREGUES (ENTREGADORES, GERENTES E ADMIN)
    // --------------------------------------------------------------------------
    if (['entregador', 'gerente', 'admin'].includes(userRole)) {
      menuItems.push(entreguesItem);
    }

    // --------------------------------------------------------------------------
    // BLOCO C: RELATÓRIOS (para quem está vinculado a loja ou admin)
    // --------------------------------------------------------------------------
    if (userLojas.length > 0 || userRole === 'admin') {
      menuItems.push(relatoriosItem);
    }

    // --------------------------------------------------------------------------
    // BLOCO D: GESTÃO E TODOS OS PEDIDOS (GERENTE E ADMIN)
    // --------------------------------------------------------------------------
    if (['gerente', 'admin'].includes(userRole)) {
      menuItems.push(gestaoItem, todosItem);
    }

    // --------------------------------------------------------------------------
    // BLOCO E: ADMINISTRAÇÃO (APENAS ADMIN)
    // --------------------------------------------------------------------------
    if (userRole === 'admin') {
      menuItems.push(adminItem);
    }
  }

  // ============================================================================
  // 3. FUNÇÃO: LOGOUT DO USUÁRIO
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
  // 4. FUNÇÃO: REDIRECIONAR PARA LOGIN
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
  // 5. FUNÇÃO: FECHAR SIDEBAR AO CLICAR EM ITEM (MOBILE)
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
  // 6. RENDERIZAÇÃO DO COMPONENTE
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