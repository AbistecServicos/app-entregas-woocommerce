// components/Layout.js
import { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

// ==============================================================================
// COMPONENTE LAYOUT PRINCIPAL
// ==============================================================================
/**
 * Layout é o componente que define a estrutura básica de todas as páginas
 * Ele gerencia: Sidebar, Header e Conteúdo principal
 * 
 * @param {Object} props - Propriedades do componente
 * @param {ReactNode} props.children - Conteúdo da página
 * @param {boolean} [props.hideSidebar=false] - Oculta a sidebar (para páginas como Admin)
 */
const Layout = ({ children, hideSidebar = false }) => {
  // ============================================================================
  // 1. ESTADOS DO COMPONENTE
  // ============================================================================
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ============================================================================
  // 2. EFFECT: DETECTAR TAMANHO DA TELA
  // ============================================================================
  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 1024);
    
    // Verificar inicialmente
    checkIsMobile();
    
    // Adicionar listener para redimensionamento
    window.addEventListener('resize', checkIsMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // ============================================================================
  // 3. FUNÇÕES: CONTROLE DA SIDEBAR
  // ============================================================================
  /**
   * Alterna o estado da sidebar (aberto/fechado)
   */
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  /**
   * Fecha a sidebar (útil para links mobile)
   */
  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // ============================================================================
  // 4. RENDERIZAÇÃO DO LAYOUT
  // ============================================================================
  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* ====================================================================== */}
      {/* SIDEBAR - MENU LATERAL (CONDICIONAL) */}
      {/* ====================================================================== */}
      {/**
       * A sidebar é opcional (pode ser ocultada com hideSidebar=true)
       * Mas o Header SEMPRE deve aparecer, mesmo sem sidebar
       */}
      {!hideSidebar && (
        <Sidebar 
          isOpen={sidebarOpen} 
          toggleSidebar={toggleSidebar}
          onItemClick={closeSidebar}
        />
      )}
      
      {/* ====================================================================== */}
      {/* CONTEÚDO PRINCIPAL */}
      {/* ====================================================================== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* ================================================================== */}
        {/* HEADER - CABEÇALHO (SEMPRE VISÍVEL, INDEPENDENTE DA SIDEBAR) */}
        {/* ================================================================== */}
        {/**
         * ✅ CORREÇÃO: Header SEMPRE visível, mas o botão hamburger é condicional
         * showMenuButton=false quando hideSidebar=true
         */}
        <Header 
          toggleSidebar={toggleSidebar} 
          showMenuButton={!hideSidebar} // Botão só aparece se sidebar existir
          title={hideSidebar ? "Painel Administrativo" : undefined} // Título customizado para Admin
        />
        
        {/* ================================================================== */}
        {/* CONTEÚDO DA PÁGINA */}
        {/* ================================================================== */}
        <main 
          className="flex-1 overflow-y-auto p-4 lg:p-6"
          id="main-content"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      {/* ====================================================================== */}
      {/* OVERLAY - SOMENTE MOBILE E QUANDO SIDEBAR NÃO ESTÁ OCULTA */}
      {/* ====================================================================== */}
      {!hideSidebar && sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
          role="button"
          aria-label="Fechar menu"
        />
      )}
    </div>
  );
};

export default Layout;