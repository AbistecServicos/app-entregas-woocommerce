importScripts('https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.0/firebase-messaging-compat.js');

// ==============================================================================
// CONFIGURAÇÃO DO FIREBASE
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
// INICIALIZAÇÃO - COM TRATAMENTO DE ERRO
// ==============================================================================

try {
  console.log('🚀 Service Worker - Iniciando...');
  
  // Inicializar Firebase
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();
  
  console.log('✅ Firebase inicializado no Service Worker');

  // ============================================================================
  // 1. BACKGROUND MESSAGES (APP FECHADO) - CORRIGIDO
  // ============================================================================
  messaging.onBackgroundMessage((payload) => {
    console.log('📢 Background message recebida:', payload);
    
    // Dados da notificação
    const notificationTitle = payload.notification?.title || '🚚 Novo Pedido!';
    const notificationBody = payload.notification?.body || 'Clique para ver detalhes';
    
    console.log('🎯 Criando notificação:', { notificationTitle, notificationBody });

    // Opções da notificação
    const notificationOptions = {
      body: notificationBody,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: payload.data || {},
      tag: `pedido-${Date.now()}`,
      requireInteraction: true,
      silent: false, // ✅ COM SOM
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'view',
          title: '📋 Ver Pedido'
        }
      ]
    };

    // ✅ MOSTRAR NOTIFICAÇÃO
    return self.registration.showNotification(notificationTitle, notificationOptions)
      .then(() => {
        console.log('✅ Notificação exibida com sucesso');
        
        // ✅ TOCAR SOM APÓS EXIBIR NOTIFICAÇÃO
        return playNotificationSound();
      })
      .catch((error) => {
        console.error('❌ Erro ao exibir notificação:', error);
      });
  });

  // ============================================================================
  // 2. PUSH EVENT (PARA NOTIFICAÇÕES DIRETAS) - CRÍTICO!
  // ============================================================================
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

    const notificationOptions = {
      body: notificationBody,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: payload.data || {},
      tag: `push-${Date.now()}`,
      requireInteraction: true,
      silent: false,
      vibrate: [200, 100, 200]
    };

    // ✅ MOSTRAR NOTIFICAÇÃO E TOCAR SOM
    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
        .then(() => {
          console.log('✅ Notificação push exibida');
          return playNotificationSound();
        })
        .catch(error => {
          console.error('❌ Erro na notificação push:', error);
        })
    );
  });

  // ============================================================================
  // 3. CLICK NA NOTIFICAÇÃO
  // ============================================================================
  self.addEventListener('notificationclick', (event) => {
    console.log('👆 Notificação clicada:', event.notification);
    
    event.notification.close();

    // Determinar URL de destino
    let targetUrl = '/pedidos-pendentes';
    const payloadData = event.notification.data;

    if (payloadData && payloadData.url) {
      targetUrl = payloadData.url;
    }

    if (event.action === 'view') {
      targetUrl = '/pedidos-pendentes';
    }

    // Abrir/focar na página
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Tentar focar em janela existente
          for (const client of clientList) {
            if (client.url.includes(targetUrl) && 'focus' in client) {
              return client.focus();
            }
          }
          // Abrir nova janela
          if (self.clients.openWindow) {
            return self.clients.openWindow(targetUrl);
          }
        })
    );
  });

  // ============================================================================
  // 4. FUNÇÃO PARA TOCAR SOM - CORRIGIDA
  // ============================================================================
  function playNotificationSound() {
    return new Promise((resolve) => {
      try {
        console.log('🎵 Tentando tocar som de notificação...');
        
        // Criar contexto de áudio
        const audioContext = new (self.AudioContext || self.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Configurar som
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
        oscillator.onended = () => {
          console.log('🔊 Som de notificação tocado');
          resolve();
        };
        
      } catch (error) {
        console.log('🔇 Fallback: Som não disponível', error);
        resolve(); // Resolver mesmo se falhar
      }
    });
  }

  // ============================================================================
  // 5. EVENTOS DO SERVICE WORKER
  // ============================================================================
  self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker instalado - EntregasWoo');
    self.skipWaiting(); // Ativar imediatamente
  });

  self.addEventListener('activate', (event) => {
    console.log('🎯 Service Worker ativado - EntregasWoo');
    event.waitUntil(self.clients.claim()); // Controlar todas as páginas
  });

  console.log('🚀 Service Worker configurado com sucesso!');

} catch (error) {
  console.error('💥 ERRO no Service Worker:', error);
}

// Log inicial
console.log('🔔 Service Worker carregado - Pronto para notificações!');