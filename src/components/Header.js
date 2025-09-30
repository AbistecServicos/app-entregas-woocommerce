// components/Header.js
import { useState, useEffect } from 'react';
import { useFirebaseNotifications } from '../hooks/useFirebaseNotifications';

const Header = ({ 
  toggleSidebar, 
  showMenuButton = true,
  title,
  userLojas = [],
  userId, // ✅ AGORA RECEBENDO USER ID
  notificationCount = 0, // ✅ CONTADOR VINDO DO LAYOUT
  onNotificationClick // ✅ CALLBACK PARA CLIQUE NO SININHO
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  
  // ✅ CONECTAR COM SISTEMA DE NOTIFICAÇÕES FCM
  const { notification, token, isSupported } = useFirebaseNotifications(userId);

  // ============================================================================
  // EFFECT: SINCRONIZAR COM CONTADOR DO LAYOUT + NOTIFICAÇÕES FCM
  // ============================================================================
  useEffect(() => {
    // Usar o maior valor entre o contador do Layout e notificações FCM
    const total = Math.max(notificationCount, unreadCount);
    console.log('🔔 Header - Sincronizando contador:', {
      layoutCount: notificationCount,
      fcmCount: unreadCount,
      total
    });
  }, [notificationCount, unreadCount]);

  // ============================================================================
  // EFFECT: ATUALIZAR CONTADOR QUANDO CHEGAR NOTIFICAÇÃO FCM
  // ============================================================================
  useEffect(() => {
    if (notification) {
      console.log('📩 Header - Nova notificação FCM recebida:', notification);
      setUnreadCount(prev => prev + 1);
      
      // ✅ TOCAR SOM DA NOTIFICAÇÃO
      playNotificationSound();
    }
  }, [notification]);

  // ============================================================================
  // FUNÇÃO: TOCAR SOM DA NOTIFICAÇÃO
  // ============================================================================
  const playNotificationSound = () => {
    try {
      console.log('🎵 Header - Tocando som de notificação...');
      
      // Criar áudio
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.7;
      
      audio.play().catch(error => {
        console.log('🔇 Header - Fallback para som do sistema');
        // Fallback: usar API de áudio do navegador
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      });
      
    } catch (error) {
      console.error('❌ Header - Erro no áudio:', error);
    }
  };

  // ============================================================================
  // EFFECT: DEBUG - VERIFICAR STATUS DAS NOTIFICAÇÕES
  // ============================================================================
  useEffect(() => {
    console.log('🔔 Header - Status notificações:', {
      token: token ? '✅' : '❌',
      supported: isSupported ? '✅' : '❌', 
      notification: notification ? '✅' : '❌',
      unreadCount,
      layoutCount: notificationCount
    });
  }, [token, isSupported, notification, unreadCount, notificationCount]);

  // ============================================================================
  // HANDLER: CLIQUE NO SININHO
  // ============================================================================
  const handleNotificationClick = () => {
    console.log('📌 Sino clicado - Notificações:', unreadCount);
    
    // Limpar notificações locais
    setUnreadCount(0);
    
    // Chamar callback do Layout (se existir)
    if (onNotificationClick) {
      onNotificationClick();
    }
    
    // Redirecionar para pedidos pendentes
    window.location.href = '/pedidos-pendentes';
  };

  // ✅ CALCULAR TOTAL - COMBINAR NOTIFICAÇÕES FCM + LAYOUT
  const totalNotifications = Math.max(notificationCount, unreadCount);

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
            className="relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors group"
            aria-label={`Notificações ${totalNotifications > 0 ? `(${totalNotifications} novas)` : ''}`}
          >
            {/* ÍCONE DO SININHO */}
            <svg className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            
            {/* BADGE COM NÚMERO - SEMPRE VISÍVEL SE > 0 */}
            {totalNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs min-w-[20px] h-5 flex items-center justify-center px-1 font-medium animate-pulse shadow-lg border-2 border-white">
                {totalNotifications > 9 ? '9+' : totalNotifications}
              </span>
            )}
          </button>

          {/* AVATAR DO USUÁRIO */}
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
            U
          </div>
        </div>
      </div>

      {/* ✅ BARRA DE STATUS - SEMPRE VISÍVEL EM DESENVOLVIMENTO */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 border-t border-green-400 px-4 py-2">
          <div className="flex items-center justify-between text-white text-xs">
            <div className="flex items-center space-x-4">
              <span className={`font-bold ${token ? 'text-green-100' : 'text-red-200'}`}>
                🔔 FCM: {token ? 'CONECTADO' : 'SEM TOKEN'}
              </span>
              <span className="bg-white text-green-600 px-2 py-1 rounded font-bold">
                Notificações: {totalNotifications}
              </span>
              <span className={isSupported ? 'text-green-100' : 'text-red-200'}>
                Suporte: {isSupported ? '✅' : '❌'}
              </span>
            </div>
            <div className="text-green-200">
              User: {userId ? '✅' : '❌'} | Lojas: {userLojas.length}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;