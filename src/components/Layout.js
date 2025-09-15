import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import UserProfile from './UserProfile'; // ✅ Novo componente de perfil

// ==============================================================================
// COMPONENTE LAYOUT PRINCIPAL
// ==============================================================================
/**
 * Layout é o componente que define a estrutura básica de todas as páginas
 * Ele gerencia: Sidebar, Header, Conteúdo principal e Perfil do usuário
 */
const Layout = ({ children }) => {
  // ============================================================================
  // 1. ESTADOS DO COMPONENTE
  // ============================================================================
  const [sidebarOpen, setSidebarOpen] = useState(false); // Controla se sidebar está aberta (mobile)

  // ============================================================================
  // 2. FUNÇÃO: TOGGLE DA SIDEBAR
  // ============================================================================
  /**
   * Alterna o estado da sidebar (aberto/fechado)
   * Usado principalmente em dispositivos móveis
   */
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // ============================================================================
  // 3. RENDERIZAÇÃO DO LAYOUT
  // ============================================================================
  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* ====================================================================== */}
      {/* SIDEBAR - MENU LATERAL */}
      {/* ====================================================================== */}
      {/**
       * Sidebar contém a navegação principal do sistema
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
         * Header contém:
         * - Botão hamburger para toggle da sidebar (mobile)
         * - Título da página atual
         * - Notificações e ações do usuário
         */}
        <Header toggleSidebar={toggleSidebar} />
        
        {/* CONTEÚDO DA PÁGINA */}
        {/**
         * Área principal onde o conteúdo das páginas é renderizado
         * - overflow-y-auto: permite scroll vertical quando necessário
         * - padding responsivo: menor em mobile, maior em desktop
         */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* ====================================================================== */}
      {/* PERFIL DO USUÁRIO - NOVA ADIÇÃO */}
      {/* ====================================================================== */}
      {/**
       * UserProfile exibe informações do usuário logado
       * Posicionado de forma fixa na parte inferior da tela
       * Em mobile: aparece acima do conteúdo quando sidebar está aberta
       * Em desktop: aparece fixo na parte inferior da sidebar
       */}
      <div className={`
        fixed bottom-0 left-0 right-0 
        lg:relative lg:left-auto lg:right-auto lg:bottom-auto
        z-40 lg:z-auto
        ${sidebarOpen ? 'block' : 'hidden lg:block'}
      `}>
        <UserProfile />
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