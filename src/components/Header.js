// components/Header.js
import { useState, useEffect } from 'react';
import { useFirebaseNotifications } from '../hooks/useFirebaseNotifications';

const Header = ({ 
  toggleSidebar, 
  showMenuButton = true,
  title,
  userLojas = [],
  userId // ✅ PRECISAMOS DO USER ID
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  
  // ✅ CONECTAR COM SISTEMA DE NOTIFICAÇÕES FCM
  const { notification, token, isSupported } = useFirebaseNotifications(userId);

  // ============================================================================
  // EFFECT: ATUALIZAR CONTADOR QUANDO CHEGAR NOTIFICAÇÃO FCM
  // ============================================================================
  useEffect(() => {
    if (notification) {
      console.log('📩 Header - Nova notificação FCM recebida:', notification);
      setUnreadCount(prev => prev + 1);
      
      // ✅ PODEMOS TAMBÉM MOSTRAR UMA NOTIFICAÇÃO LOCAL DE CONFIRMAÇÃO
      if (Notification.permission === 'granted') {
        new Notification('🔔 Nova notificação', {
          body: 'Você tem um novo pedido para visualizar',
          icon: '/icon-192x192.png',
          silent: true // Não toca som duplicado
        });
      }
    }
  }, [notification]);

  // ============================================================================
  // EFFECT: DEBUG - VERIFICAR STATUS DAS NOTIFICAÇÕES
  // ============================================================================
  useEffect(() => {
    console.log('🔔 Header - Status notificações:', {
      token: token ? '✅' : '❌',
      supported: isSupported ? '✅' : '❌',
      notification: notification ? '✅' : '❌',
      unreadCount
    });
  }, [token, isSupported, notification, unreadCount]);

  const handleNotificationClick = () => {
    console.log('📌 Sino clicado - limpando notificações');
    setUnreadCount(0);
    
    // Redirecionar para pedidos pendentes
    window.location.href = '/pedidos-pendentes';
  };

  const totalNotifications = unreadCount;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        
        {/* LADO ESQUERDO - BOTÃO HAMBURGUER */}
        <div className="flex items-center">
          {showMenuButton && (
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              aria-label="Abrir menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>

        {/* CENTRO - LOGO */}
        <div className="flex-1 flex justify-center lg:justify-start">
          <div className="flex items-center">
            <img 
              src="https://czzidhzzpqegfvvmdgno.supabase.co/storage/v1/object/public/box/logos/logo_entregaswoo_600x240.png"
              alt="EntregasWoo"
              className="h-16 w-auto object-contain"
            />
            {title && (
              <h1 className="text-xl font-semibold text-gray-900 ml-4 hidden md:block">
                {title}
              </h1>
            )}
          </div>
        </div>

        {/* LADO DIREITO - NOTIFICAÇÕES */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleNotificationClick}
            className="relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label={`Notificações ${totalNotifications > 0 ? `(${totalNotifications} novas)` : ''}`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            
            {totalNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs min-w-[20px] h-5 flex items-center justify-center px-1 font-medium animate-pulse">
                {totalNotifications > 9 ? '9+' : totalNotifications}
              </span>
            )}
          </button>

          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
            U
          </div>
        </div>
      </div>

      {/* ✅ DEBUG - STATUS DAS NOTIFICAÇÕES */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-green-50 border-t border-green-200 px-4 py-1">
          <p className="text-xs text-green-700 text-center">
            🔔 FCM: {token ? 'CONECTADO' : 'SEM TOKEN'} | 
            Notificações: {totalNotifications} | 
            Suporte: {isSupported ? '✅' : '❌'}
          </p>
        </div>
      )}
    </header>
  );
};

export default Header;