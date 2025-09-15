// components/Layout.js
import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

// ==============================================================================
// COMPONENTE LAYOUT PRINCIPAL
// ==============================================================================
/**
 * Layout é o componente que define a estrutura básica de todas as páginas
 * Ele gerencia: Sidebar, Header e Conteúdo principal
 * O perfil do usuário agora está DENTRO do Sidebar para melhor uso do espaço mobile
 */
const Layout = ({ children }) => {
  // ============================================================================
  // 1. ESTADOS DO COMPONENTE
  // ============================================================================
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ============================================================================
  // 2. FUNÇÃO: TOGGLE DA SIDEBAR
  // ============================================================================
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // ============================================================================
  // 3. RENDERIZAÇÃO DO LAYOUT
  // ============================================================================
  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* ====================================================================== */}
      {/* SIDEBAR - MENU LATERAL (AGORA COM PERFIL INCLUÍDO) */}
      {/* ====================================================================== */}
      {/**
       * Sidebar contém:
       * - Navegação principal do sistema
       * - Perfil do usuário (no footer do sidebar)
       * Em mobile: fica sobreposta ao conteúdo
       * Em desktop: fica fixa à esquerda
       */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* ====================================================================== */}
      {/* CONTEÚDO PRINCIPAL */}
      {/* ====================================================================== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER - CABEÇALHO */}
        {/**
         * Header contém botão hamburger e título da página
         * Fixo no topo em mobile para melhor usabilidade
         */}
        <Header toggleSidebar={toggleSidebar} />
        
        {/* CONTEÚDO DA PÁGINA */}
        {/**
         * Área principal com espaço máximo para cards
         * Scroll vertical liberado sem elementos fixos competindo por espaço
         */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* ====================================================================== */}
      {/* OVERLAY - SOMENTE MOBILE */}
      {/* ====================================================================== */}
      {/**
       * Overlay escurece o conteúdo quando sidebar está aberta em mobile
       * Ao clicar no overlay, fecha a sidebar
       */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default Layout;