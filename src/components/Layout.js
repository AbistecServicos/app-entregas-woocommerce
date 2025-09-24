// components/Layout.js
import { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useUserProfile } from '../hooks/useUserProfile';
import { useFirebaseNotifications } from '../hooks/useFirebaseNotifications';

// ==============================================================================
// COMPONENTE LAYOUT PRINCIPAL COM NOTIFICAÇÕES PUSH
// ==============================================================================
/**
 * Layout é o componente que define a estrutura básica de todas as páginas
 * Agora com sistema integrado de notificações push
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
  const [notifications, setNotifications] = useState([]);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [latestNotification, setLatestNotification] = useState(null);

  // ============================================================================
  // 2. HOOKS: PERFIL DO USUÁRIO E NOTIFICAÇÕES
  // ============================================================================
  /**
   * Hook para gerenciar perfil do usuário autenticado
   * Fornece dados do usuário logado
   */
  const { userProfile, loading: userLoading } = useUserProfile();
  
  /**
   * Hook para gerenciar notificações push do Firebase
   * - Gera token FCM automaticamente
   * - Escuta mensagens em foreground
   * - Salva token no banco de dados
   * 
   * Só inicializa quando usuário está logado (evita erros)
   */
  const { token, notification, isSupported } = useFirebaseNotifications(
    userProfile?.uid || null
  );

  // ============================================================================
  // 3. EFFECT: DETECTAR TAMANHO DA TELA
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
  // 4. EFFECT: GERENCIAR NOTIFICAÇÕES RECEBIDAS
  // ============================================================================
  useEffect(() => {
    if (notification) {
      console.log('📢 Nova notificação recebida no Layout:', notification);
      
      // Adicionar à lista de notificações
      setNotifications(prev => [notification, ...prev].slice(0, 10)); // Mantém apenas as 10 mais recentes
      
      // Mostrar toast de notificação
      setLatestNotification(notification);
      setShowNotificationToast(true);
      
      // Auto-esconder toast após 5 segundos
      const timer = setTimeout(() => {
        setShowNotificationToast(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ============================================================================
  // 5. EFFECT: LOGS DE DEBUG (OPCIONAL)
  // ============================================================================
  useEffect(() => {
    if (userProfile?.uid && isSupported) {
      console.log('🔔 Sistema de notificações inicializado para usuário:', userProfile.uid);
      console.log('📱 Suporte a notificações:', isSupported ? '✅ Sim' : '❌ Não');
      if (token) {
        console.log('🔑 Token FCM gerado:', token.substring(0, 50) + '...');
      }
    }
  }, [userProfile, isSupported, token]);

  // ============================================================================
  // 6. FUNÇÕES: CONTROLE DA SIDEBAR
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

  /**
   * Fecha o toast de notificação
   */
  const closeNotificationToast = () => {
    setShowNotificationToast(false);
  };

  /**
   * Limpa todas as notificações
   */
  const clearAllNotifications = () => {
    setNotifications([]);
    setShowNotificationToast(false);
  };

  // ============================================================================
  // 7. RENDERIZAÇÃO DO LAYOUT
  // ============================================================================
  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* ====================================================================== */}
      {/* SIDEBAR - MENU LATERAL (CONDICIONAL) */}
      {/* ====================================================================== */}
      {!hideSidebar && (
        <Sidebar 
          isOpen={sidebarOpen} 
          toggleSidebar={toggleSidebar}
          onItemClick={closeSidebar}
          notificationCount={notifications.length} // Passa contador para sidebar
        />
      )}
      
      {/* ====================================================================== */}
      {/* CONTEÚDO PRINCIPAL */}
      {/* ====================================================================== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* ================================================================== */}
        {/* HEADER - CABEÇALHO COM INDICADOR DE NOTIFICAÇÕES */}
        {/* ================================================================== */}
  <Header 
  toggleSidebar={toggleSidebar} 
  showMenuButton={!hideSidebar}
  title={hideSidebar ? "Painel Administrativo" : undefined}
  notificationCount={notifications.length}
  onNotificationClick={() => {
    console.log('Notificações clicadas:', notifications);
    setShowNotificationToast(true);
  }}
/>
        
        {/* ================================================================== */}
        {/* TOAST DE NOTIFICAÇÃO (APARECE NO CANTO SUPERIOR) */}
        {/* ================================================================== */}
        {showNotificationToast && latestNotification && (
          <div className="fixed top-4 right-4 z-50 max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 animate-fade-in">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {latestNotification.notification?.title || 'Nova Notificação'}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {latestNotification.notification?.body || 'Você tem uma nova mensagem'}
                  </p>
                  <span className="text-xs text-gray-400 mt-2 block">
                    {new Date().toLocaleTimeString('pt-BR')}
                  </span>
                </div>
                <button 
                  onClick={closeNotificationToast}
                  className="ml-4 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {/* Botão de ação se houver dados customizados */}
              {latestNotification.data && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button 
                    onClick={() => {
                      console.log('Dados da notificação:', latestNotification.data);
                      closeNotificationToast();
                    }}
                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                  >
                    Ver detalhes
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* BADGE DE STATUS DO SISTEMA (APENAS DESENVOLVIMENTO) */}
        {/* ================================================================== */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 z-40 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
            🔔 Notificações: {isSupported ? '✅' : '❌'} | 
            Token: {token ? '✅' : '❌'} | 
            Msgs: {notifications.length}
          </div>
        )}
        
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