// components/Sidebar.js
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';
import UserProfile from './UserProfile';

// ==============================================================================
// COMPONENTE SIDEBAR - MENU LATERAL
// ==============================================================================
/**
 * Sidebar é o menu de navegação lateral do sistema
 * Contém: Logo, Menu de navegação, Perfil do usuário e Botão de logout
 * Responsivo: Mobile (overlay) e Desktop (fixo)
 */
const Sidebar = ({ isOpen, toggleSidebar }) => {
  const router = useRouter();
  const { userRole, loading: loadingUser } = useUserProfile();
  
  // ============================================================================
  // 1. ITENS DO MENU COM RESTRIÇÃO DE ACESSO
  // ============================================================================
  /**
   * Itens base do menu - visíveis para todos os usuários logados
   * Inclui páginas básicas de pedidos
   */
  const baseItems = [
    { path: '/pedidos-pendentes', icon: '📋', label: 'Pedidos Pendentes' },
    { path: '/pedidos-aceitos', icon: '✅', label: 'Pedidos Aceitos' },
    { path: '/pedidos-entregues', icon: '🚚', label: 'Pedidos Entregues' },
  ];

  /**
   * Itens administrativos - visíveis apenas para gerentes e administradores
   * Inclui gestão completa e administração
   */
  const adminItems = [
    { path: '/todos-pedidos', icon: '📊', label: 'Todos os Pedidos' },
    { path: '/admin', icon: '⚙️', label: 'Administração' },
  ];

  /**
   * Combina itens conforme a role do usuário
   * Entregadores: apenas itens base
   * Gerentes/Admin: itens base + itens administrativos
   */
  const menuItems = [
    ...baseItems,
    ...((userRole === 'admin' || userRole === 'gerente') ? adminItems : [])
  ];

  // ============================================================================
  // 2. FUNÇÃO: LOGOUT DO USUÁRIO
  // ============================================================================
  /**
   * Realiza logout do usuário no Supabase Auth
   * Fecha sidebar no mobile antes de redirecionar
   * Redireciona para página de login após logout
   */
  const handleLogout = async () => {
    try {
      // Fechar sidebar no mobile antes do logout
      if (window.innerWidth < 1024) {
        toggleSidebar();
      }
      
      // Realizar logout via Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Redirecionar para login
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // ============================================================================
  // 3. FUNÇÃO: FECHAR SIDEBAR AO CLICAR EM ITEM (MOBILE)
  // ============================================================================
  /**
   * Fecha automaticamente o sidebar no mobile quando um item é clicado
   * Melhora a experiência mobile evitando overlay permanente
   */
  const handleMenuItemClick = () => {
    if (window.innerWidth < 1024) {
      toggleSidebar();
    }
  };

  // ============================================================================
  // 4. RENDERIZAÇÃO DO COMPONENTE
  // ============================================================================
  return (
    <>
      {/* ====================================================================== */}
      {/* OVERLAY PARA MOBILE */}
      {/* ====================================================================== */}
      {/**
       * Overlay escurece o conteúdo de fundo quando sidebar está aberta no mobile
       * Ao clicar no overlay, fecha automaticamente o sidebar
       * Visível apenas em dispositivos mobile (lg:hidden)
       */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* ====================================================================== */}
      {/* SIDEBAR PRINCIPAL */}
      {/* ====================================================================== */}
      {/**
       * Container principal do sidebar
       * Mobile: fixed com transição slide
       * Desktop: static como parte do layout
       * Background roxo com texto branco para contraste
       */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-purple-800 text-white
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col h-full
      `}>
        
        {/* ================================================================== */}
        {/* LOGO / MARCA DO SISTEMA */}
        {/* ================================================================== */}
        {/**
         * Cabeçalho com logo e nome do sistema
         * Border inferior para separação visual
         * AGORA COM LINK PARA PÁGINA INICIAL E FECHAMENTO NO MOBILE
         */}
        <div className="p-6 border-b border-purple-700">
          <Link href="/" passHref onClick={handleMenuItemClick}>
            <div className="cursor-pointer">
              <h1 className="text-2xl font-bold">EntregasWoo</h1>
              <p className="text-purple-300 text-sm">Sistema de Gestão</p>
            </div>
          </Link>
        </div>

        {/* ================================================================== */}
        {/* MENU DE NAVEGAÇÃO */}
        {/* ================================================================== */}
        {/**
         * Lista de itens de navegação
         * Scrollável caso tenha muitos itens
         * Estilos condicionais para item ativo
         */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center py-3 px-4 rounded-lg mb-2 transition-colors
                ${router.pathname === item.path
                  ? 'bg-purple-900 text-white' // Item ativo
                  : 'hover:bg-purple-700 text-purple-200' // Item normal/hover
                }`}
              onClick={handleMenuItemClick}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* ================================================================== */}
        {/* PERFIL DO USUÁRIO */}
        {/* ================================================================== */}
        {/**
         * Área de perfil do usuário logado
         * Mostra foto, nome, email, função e lojas associadas
         * Fundo mais escuro para destaque
         */}
        <div className="p-4 border-t border-purple-700 bg-purple-900">
          <UserProfile />
        </div>

        {/* ================================================================== */}
        {/* BOTÃO DE LOGOUT */}
        {/* ================================================================== */}
        {/**
         * Botão para desconectar o usuário do sistema
         * Estilo destacado para ação importante
         */}
        <div className="p-4 border-t border-purple-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center py-2 px-4 bg-purple-700 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;