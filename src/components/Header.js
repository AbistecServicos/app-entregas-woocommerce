// ========================================
// HEADER.JS - COMPONENTE CORRIGIDO
// ========================================
// Descrição: Header com sidebar toggle + sino de notificações FCM (badge + som).
// Correção: Usa forceRefreshToken para evitar erros de duplicata no clique do sininho.
// ========================================

import { useState, useEffect, useCallback } from 'react';
import { useFirebaseNotifications } from '../hooks/useFirebaseNotifications';

const Header = ({ 
  toggleSidebar, 
  showMenuButton = true,
  title,
  userLojas = [],
  userId, // User ID para hook FCM.
  notificationCount = 0, // Contador do layout (ex.: DB unread).
  onNotificationClick // Callback para limpar global.
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationIds, setNotificationIds] = useState(new Set()); // Dedup por ID.
  
  // ✅ CORREÇÃO: Adicionar forceRefreshToken do hook
  const { notification, token, isSupported, forceRefreshToken } = useFirebaseNotifications(userId);

  const isDev = process.env.NODE_ENV === 'development';

  // ============================================================================
  // 1. EFFECT: SINCRONIZAR CONTADOR (LAYOUT + FCM, COM DEDUP)
  // ============================================================================
  useEffect(() => {
    let total = notificationCount; // Base layout.
    if (notification && notification.data?.orderId && !notificationIds.has(notification.data.orderId)) {
      total += 1;
      setNotificationIds(prev => new Set([...prev, notification.data.orderId]));
    }
    setUnreadCount(total);
    if (isDev) console.log('🔔 Header - Sincronizando contador:', { layoutCount: notificationCount, fcmNew: !!notification, total });
  }, [notificationCount, notification]);

  // ============================================================================
  // 2. EFFECT: ATUALIZAR CONTADOR + SOM EM NOVA FCM
  // ============================================================================
  useEffect(() => {
    if (notification) {
      if (isDev) console.log('📩 Header - Nova notificação FCM recebida:', notification);
      playNotificationSound(); // Som imediato.
    }
  }, [notification]);

  // ============================================================================
  // 3. FUNÇÃO: TOCAR SOM (ROBUSTO, COM RESUME)
  // ============================================================================
  const playNotificationSound = useCallback(() => {
    if (isDev) console.log('🎵 Header - Tocando som de notificação...');
    
    // Tenta MP3 primeiro (public/notification.mp3).
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.7;
    audio.play()
      .then(() => { if (isDev) console.log('🔊 Som MP3 tocado'); })
      .catch((error) => {
        if (isDev) console.log('🔇 Fallback MP3 falhou, usando AudioContext');
        // Fallback: AudioContext com resume (para background tabs/iOS).
        if (!window.AudioContext) return;
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContext.resume().then(() => { // Resume se paused.
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
          
          if (isDev) console.log('🔊 AudioContext tocado');
        }).catch(() => { if (isDev) console.log('❌ AudioContext paused (user gesture needed)'); });
      });
  }, []);

  // ============================================================================
  // 4. EFFECT: DEBUG STATUS (DEV-ONLY, MÍNIMO)
  // ============================================================================
  useEffect(() => {
    if (isDev) {
      console.log('🔔 Header - Status notificações:', {
        token: token ? '✅' : '❌',
        supported: isSupported ? '✅' : '❌', 
        notification: notification ? '✅' : '❌',
        unreadCount,
        layoutCount: notificationCount
      });
    }
  }, [token, isSupported, unreadCount, notificationCount]);

  // ============================================================================
  // 5. HANDLER: CLIQUE NO SININHO (CORRIGIDO - SEM forceRefreshToken)
  // ============================================================================
  const handleNotificationClick = useCallback(async () => {
    if (isDev) console.log('📌 Sino clicado - Notificações:', unreadCount);
    
    // ✅ CORREÇÃO: Remove a tentativa de atualizar token que causava erro
    // O token FCM já é gerenciado automaticamente pelo hook
    
    // Limpa local.
    setUnreadCount(0);
    setNotificationIds(new Set()); // Reset dedup.
    
    // Callback global (ex.: limpa DB unread).
    if (onNotificationClick) onNotificationClick();
    
    // Redirect simples e direto
    window.location.href = '/pedidos-pendentes';
  }, [unreadCount, onNotificationClick]); // ✅ Remove forceRefreshToken das dependências

  // Total: unreadCount (já sync'd).
  const totalNotifications = unreadCount;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        
        {/* Lado Esquerdo: Botão Hambúrguer */}
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

        {/* Centro: Logo + Título */}
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

        {/* Lado Direito: Sino + Avatar */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleNotificationClick}
            className="relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors group"
            aria-label={`Notificações ${totalNotifications > 0 ? `(${totalNotifications} novas)` : 'Nenhuma nova'}`}
          >
            {/* Ícone Sino */}
            <svg className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            
            {/* Badge: Visível se >0; anima pulse; limite 9+ */}
            {totalNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs min-w-[20px] h-5 flex items-center justify-center px-1 font-medium animate-pulse shadow-lg border-2 border-white">
                {totalNotifications > 9 ? '9+' : totalNotifications}
              </span>
            )}
          </button>

          {/* Avatar Simples (Expanda para User Foto) */}
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
            U
          </div>
        </div>
      </div>

      {/* Barra Status Dev (Opcional, Esconde em Prod) */}
      {isDev && (
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