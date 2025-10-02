// ========================================
// LAYOUT.JS - COMPONENTE OTIMIZADO
// ========================================
// Descrição: Wrapper principal com Header, Sidebar, notificações FCM (toast + count).
// Integração: Sync FCM hook + layout count; mobile responsive.
// Melhoria: Dedup notificações; logs dev-only; toast queue simples.
// Manutenção: Seções numeradas. Alinha PDF (anon_key para token; HS256 FCM compat).
// ========================================

import { useState, useEffect, useMemo } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useUserProfile } from '../hooks/useUserProfile';
import { useFirebaseNotifications } from '../hooks/useFirebaseNotifications';

const Layout = ({ 
  children, 
  hideSidebar = false,
  userLojas = [], // Lojas para role/menu.
  initialUser = null, // User inicial do _app.
  isLoading = false // Loading global.
}) => {
  // ============================================================================
  // 1. ESTADOS DO COMPONENTE
  // ============================================================================
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notifications, setNotifications] = useState([]); // Lista dedup'd.
  const [notificationIds, setNotificationIds] = useState(new Set()); // Dedup por ID.
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [latestNotification, setLatestNotification] = useState(null);

  const isDev = process.env.NODE_ENV === 'development';

  // ============================================================================
  // 2. HOOKS: PERFIL + FCM (MEMOIZADO)
  // ============================================================================
  const { userProfile, loading: userLoading } = useUserProfile();
  
  // Memo para uid estável (evita re-init hook em re-renders).
  const uid = useMemo(() => userProfile?.uid || null, [userProfile?.uid]);
  
  // Hook FCM com uid memoizado.
  const { 
    token = null, 
    notification = null, 
    isSupported = false 
  } = useFirebaseNotifications(uid);

  // ============================================================================
  // 3. EFFECT: DETECTAR TAMANHO DA TELA (ORIGINAL)
  // ============================================================================
  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 1024);
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // ============================================================================
  // 4. EFFECT: GERENCIAR NOTIFICAÇÕES FCM (COM DEDUP)
  // ============================================================================
  // Adiciona só se ID novo; toast para latest.
  useEffect(() => {
    if (notification && notification.data?.orderId) {
      const notifId = notification.data.orderId;
      if (!notificationIds.has(notifId)) {
        if (isDev) console.log('📢 Layout - Nova notificação FCM (única):', notification);
        
        setNotifications(prev => [notification, ...prev].slice(0, 10)); // Limite 10.
        setNotificationIds(prev => new Set([...prev, notifId]));
        setLatestNotification(notification);
        setShowNotificationToast(true);
        
        const timer = setTimeout(() => setShowNotificationToast(false), 5000);
        return () => clearTimeout(timer);
      } else {
        if (isDev) console.log('🔄 Notificação FCM duplicada (ignorada):', notifId);
      }
    }
  }, [notification]); // Dep: só notification.

  // ============================================================================
  // 5. EFFECT: LOGS DEBUG (UMA VEZ, DEV-ONLY)
  // ============================================================================
  useEffect(() => {
    if (isDev && userProfile?.uid && !sessionStorage.getItem('layout_debug_logged')) {
      console.log('🏪 Layout - Inicializado:', {
        usuario: userProfile.uid,
        lojas: userLojas.length,
        suportado: isSupported,
        token: token ? '✅' : '❌'
      });
      sessionStorage.setItem('layout_debug_logged', 'true');
    }
  }, [userProfile?.uid, userLojas.length, isSupported, token]); // Deps estáveis.

  // ============================================================================
  // 6. FUNÇÕES: CONTROLE SIDEBAR + NOTIFICAÇÕES (ORIGINAL)
  // ============================================================================
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const closeSidebar = () => {
    if (isMobile) setSidebarOpen(false);
  };

  const closeNotificationToast = () => setShowNotificationToast(false);

  const clearAllNotifications = () => {
    setNotifications([]);
    setNotificationIds(new Set());
    setShowNotificationToast(false);
  };

  // ============================================================================
  // 7. RENDERIZAÇÃO (ORIGINAL + PROPS PASSADAS)
  // ============================================================================
  // Count para sino: notifications.length (FCM + dedup).
  const notificationCount = notifications.length;

  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* Sidebar */}
      {!hideSidebar && (
        <Sidebar 
          isOpen={sidebarOpen} 
          toggleSidebar={toggleSidebar}
          onItemClick={closeSidebar}
          notificationCount={notificationCount} // Passa count para sino.
          user={initialUser} 
          isLoading={isLoading} 
          userLojas={userLojas} 
        />
      )}

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header com Props */}
        <Header 
          toggleSidebar={toggleSidebar} 
          showMenuButton={!hideSidebar}
          title={hideSidebar ? "Painel Administrativo" : undefined}
          notificationCount={notificationCount} // Sync com FCM.
          onNotificationClick={() => setShowNotificationToast(true)} // Abre toast.
          userLojas={userLojas} 
          userId={uid} // Para hook no Header se precisar.
        />

        {/* Toast FCM */}
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
                      if (isDev) console.log('Dados da notificação:', latestNotification.data);
                      closeNotificationToast();
                      // Opcional: Redirect via data.url.
                      if (latestNotification.data?.url) window.location.href = latestNotification.data.url;
                    }}
                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 w-full"
                  >
                    Ver detalhes
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Badge Status Dev */}
        {isDev && (
          <div className="fixed bottom-4 left-4 z-40 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
            🔔 {isSupported ? '✅' : '❌'} | 
            Token: {token ? '✅' : '❌'} | 
            Msgs: {notificationCount} |
            Lojas: {userLojas.length}
          </div>
        )}
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Overlay Mobile */}
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