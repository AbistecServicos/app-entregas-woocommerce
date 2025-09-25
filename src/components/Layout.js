// components/Layout.js
import { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useUserProfile } from '../hooks/useUserProfile';
import { useFirebaseNotifications } from '../hooks/useFirebaseNotifications';

// ==============================================================================
// COMPONENTE LAYOUT PRINCIPAL COM NOTIFICAÇÕES PUSH
// ==============================================================================
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
  const { userProfile, loading: userLoading } = useUserProfile();
  
  /**
   * ✅ CORREÇÃO: Destructuring seguro com valores padrão
   */
  const { 
    token = null, 
    notification = null, 
    isSupported = false 
  } = useFirebaseNotifications(userProfile?.uid || null);

  // ============================================================================
  // 3. EFFECT: DETECTAR TAMANHO DA TELA
  // ============================================================================
  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 1024);
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // ============================================================================
  // 4. EFFECT: GERENCIAR NOTIFICAÇÕES RECEBIDAS
  // ============================================================================
  useEffect(() => {
    if (notification) {
      console.log('📢 Nova notificação recebida no Layout:', notification);
      
      setNotifications(prev => [notification, ...prev].slice(0, 10));
      setLatestNotification(notification);
      setShowNotificationToast(true);
      
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
    if (userProfile?.uid) {
      console.log('🔔 Sistema de notificações:', {
        usuario: userProfile.uid,
        suportado: isSupported,
        token: token ? '✅' : '❌',
        notificacoes: notifications.length
      });
    }
  }, [userProfile, isSupported, token, notifications.length]);

  // ============================================================================
  // 6. FUNÇÕES: CONTROLE DA SIDEBAR
  // ============================================================================
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const closeNotificationToast = () => {
    setShowNotificationToast(false);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setShowNotificationToast(false);
  };

  // ============================================================================
  // 7. RENDERIZAÇÃO DO LAYOUT
  // ============================================================================
  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* SIDEBAR */}
      {!hideSidebar && (
        <Sidebar 
          isOpen={sidebarOpen} 
          toggleSidebar={toggleSidebar}
          onItemClick={closeSidebar}
          notificationCount={notifications.length}
        />
      )}
      
      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <Header 
          toggleSidebar={toggleSidebar} 
          showMenuButton={!hideSidebar}
          title={hideSidebar ? "Painel Administrativo" : undefined}
          notificationCount={notifications.length}
          onNotificationClick={() => setShowNotificationToast(true)}
        />
        
        {/* TOAST DE NOTIFICAÇÃO */}
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

        {/* BADGE DE STATUS (DESENVOLVIMENTO) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 z-40 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
            🔔 {isSupported ? '✅' : '❌'} | Token: {token ? '✅' : '❌'} | Msgs: {notifications.length}
          </div>
        )}
        
        {/* CONTEÚDO DA PÁGINA */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* OVERLAY MOBILE */}
      {!hideSidebar && sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default Layout;