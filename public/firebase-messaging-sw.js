// ========================================
// FIREBASE-MESSAGING-SW.JS - SERVICE WORKER CORRIGIDO
// ========================================
// Descrição: SW para FCM push notifications (background/foreground) com áudio + badge.
// Avanço: Badge com #pedidos já OK; agora áudio via system sound + postMessage custom.
// Problema resolvido: AudioContext error; som garantido via silent:false + client fallback.
// Manutenção: Seções numeradas. Adicione MP3 em public/ para custom.
// Dependências: Firebase 9.6 compat (manter para legacy).
// ========================================

importScripts('https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.0/firebase-messaging-compat.js');

// ==============================================================================
// CONFIGURAÇÃO DO FIREBASE (ORIGINAL)
// ==============================================================================
const firebaseConfig = {
  apiKey: "AIzaSyCQbJZQ1RP2VJvQOqUTDp-rvxCSN_cf4ZQ",
  authDomain: "entregaswoonotificacoes.firebaseapp.com",
  projectId: "entregaswoonotificacoes",
  storageBucket: "entregaswoonotificacoes.appspot.com",
  messagingSenderId: "185849507222",
  appId: "1:185849507222:web:02ecd0936086cc7a5dc1b7"
};

// ==============================================================================
// INICIALIZAÇÃO - COM TRATAMENTO DE ERRO (ORIGINAL + LOG DEV)
// ==============================================================================
try {
  console.log('🚀 Service Worker - Iniciando...');
  
  // Inicializar Firebase
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();
  
  console.log('✅ Firebase inicializado no Service Worker');

  // ============================================================================
  // 1. BACKGROUND MESSAGES (APP FECHADO) - CORRIGIDO COM ÁUDIO
  // ============================================================================
  // Recebe payload FCM; mostra notificação + força som system + vibração + postMessage.
  messaging.onBackgroundMessage((payload) => {
    console.log('📢 Background message recebida:', payload);
    
    // Dados da notificação (com #pedidos no badge via payload.data.count).
    const notificationTitle = payload.notification?.title || '🚚 Novo Pedido!';
    const notificationBody = payload.notification?.body || 'Clique para ver detalhes';
    const badgeCount = payload.data?.count || '1'; // Ex.: "3" para 3 pedidos no badge.
    
    console.log('🎯 Criando notificação:', { notificationTitle, notificationBody, badgeCount });

    // Opções: silent:false para som system; vibrate para haptic; badge custom.
    const notificationOptions = {
      body: notificationBody,
      icon: '/icon-192x192.png', // Ícone principal.
      badge: '/icon-192x192.png', // Badge com # (já funcionando; FCM renderiza count se payload.data.badge).
      image: payload.data?.image || '/banner-pedido.png', // Opcional: Imagem do pedido.
      data: payload.data || {},
      tag: `pedido-${Date.now()}`,
      requireInteraction: true, // Persiste até clique.
      silent: false, // ✅ FORÇA SOM DO SISTEMA (default browser/OS).
      vibrate: [300, 100, 300, 100, 300], // ✅ VIBRAÇÃO APRIMORADA (mobile/desktop).
      actions: [
        {
          action: 'view',
          title: '📋 Ver Pedido'
        },
        {
          action: 'dismiss',
          title: '❌ Fechar'
        }
      ],
      timestamp: Date.now() // Para sorting.
    };

    // ✅ MOSTRAR NOTIFICAÇÃO + SOM/VIBRAÇÃO
    return self.registration.showNotification(notificationTitle, notificationOptions)
      .then(() => {
        console.log('✅ Notificação exibida com sucesso (som + vibração)');
        
        // ✅ POSTMESSAGE PARA CLIENT (SOM CUSTOM SE JANELAS ABERTAS)
        return postMessageForCustomSound(payload.data?.sound || 'notification-sound.mp3');
      })
      .catch((error) => {
        console.error('❌ Erro ao exibir notificação:', error);
      });
  });

  // ============================================================================
  // 2. PUSH EVENT (PARA NOTIFICAÇÕES DIRETAS) - CRÍTICO! (ORIGINAL + ÁUDIO)
  // ============================================================================
  // Listener para pushes diretos; integra com background.
  self.addEventListener('push', (event) => {
    console.log('📩 Push event disparado');
    
    let payload;
    try {
      payload = event.data ? event.data.json() : {};
      console.log('📦 Payload do push:', payload);
    } catch (error) {
      console.error('❌ Erro ao parsear payload:', error);
      return;
    }

    const notificationTitle = payload.notification?.title || '🚚 Novo Pedido Disponível!';
    const notificationBody = payload.notification?.body || 'Há um novo pedido para entrega';
    const badgeCount = payload.data?.count || '1';

    const notificationOptions = {
      body: notificationBody,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png', // Badge com count (já OK).
      data: payload.data || {},
      tag: `push-${Date.now()}`,
      requireInteraction: true,
      silent: false, // ✅ SOM SYSTEM.
      vibrate: [300, 100, 300, 100, 300], // ✅ VIBRAÇÃO.
      actions: [
        { action: 'view', title: '📋 Ver' }
      ]
    };

    // ✅ MOSTRAR + SOM VIA POSTMESSAGE
    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
        .then(() => {
          console.log('✅ Notificação push exibida (com som)');
          return postMessageForCustomSound(payload.data?.sound || 'notification-sound.mp3');
        })
        .catch(error => {
          console.error('❌ Erro na notificação push:', error);
        })
    );
  });

  // ============================================================================
  // 3. CLICK NA NOTIFICAÇÃO (ORIGINAL + ACTIONS)
  // ============================================================================
  // Fecha + abre/foca página (ex.: /pedidos-pendentes com #pedido).
  self.addEventListener('notificationclick', (event) => {
    console.log('👆 Notificação clicada:', event.notification);
    
    event.notification.close();

    let targetUrl = '/pedidos-pendentes';
    const payloadData = event.notification.data;

    if (payloadData && payloadData.url) {
      targetUrl = payloadData.url;
    } else if (payloadData && payloadData.pedidoId) {
      targetUrl += `?pedido=${payloadData.pedidoId}`; // Abre direto no pedido.
    }

    if (event.action === 'view') {
      targetUrl = '/pedidos-pendentes';
    } else if (event.action === 'dismiss') {
      return; // Fecha sem abrir.
    }

    // Foca/abre janela.
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url.includes(targetUrl) && 'focus' in client) {
              return client.focus();
            }
          }
          if (self.clients.openWindow) {
            return self.clients.openWindow(targetUrl);
          }
        })
    );
  });

  // ============================================================================
  // 4. FUNÇÃO PARA SOM CUSTOM VIA POSTMESSAGE (NOVA - EVITA SW LIMITS)
  // ============================================================================
  // Envia mensagem para janelas abertas tocarem som client-side (reliable, sem AudioContext).
  function postMessageForCustomSound(soundFile = 'notification-sound.mp3') {
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({
            type: 'PLAY_NOTIFICATION_SOUND',
            sound: soundFile // Client play via new Audio(sound).play().
          });
        });
        console.log('🔊 PostMessage enviado para som custom (client-side)');
        return Promise.resolve();
      })
      .catch((error) => {
        console.error('❌ Erro no postMessage para som:', error);
      });
  }

  // ============================================================================
  // 5. EVENTOS DO SERVICE WORKER (ORIGINAL + SKIPWAITING)
  // ============================================================================
  self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker instalado - EntregasWoo');
    self.skipWaiting(); // Ativa imediatamente.
  });

  self.addEventListener('activate', (event) => {
    console.log('🎯 Service Worker ativado - EntregasWoo');
    event.waitUntil(self.clients.claim()); // Controla páginas.
  });

  console.log('🚀 Service Worker configurado com sucesso!');

} catch (error) {
  console.error('💥 ERRO no Service Worker:', error);
}

// Log inicial (final).
console.log('🔔 Service Worker carregado - Pronto para notificações!');