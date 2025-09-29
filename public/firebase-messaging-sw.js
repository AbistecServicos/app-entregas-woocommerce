importScripts('https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.0/firebase-messaging-compat.js');

// ==============================================================================
// CONFIGURAÇÃO DO FIREBASE NO SERVICE WORKER
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
// SONS LOCAIS - SEM BLOQUEIO 🎵
// ==============================================================================

const SONS = {
  NOTIFICACAO: '/notification.mp3',  // 🔔 Som principal
  ALERTA: '/alert.mp3',              // 📣 Som alternativo
  PADRAO: '/notification.mp3'        // ✅ Fallback
};

// ⚠️ ESCOLHA O SOM PRINCIPAL AQUI:
const SOM_PRINCIPAL = SONS.NOTIFICACAO;

// ==============================================================================
// INICIALIZAÇÃO DO FIREBASE NO SERVICE WORKER
// ==============================================================================

try {
  console.log('🔥 Inicializando Firebase no Service Worker...');
  firebase.initializeApp(firebaseConfig);
  
  const messaging = firebase.messaging();
  console.log('✅ Firebase Messaging inicializado no Service Worker');

  // ============================================================================
  // 1. BACKGROUND MESSAGES (APP FECHADO)
  // ============================================================================
  messaging.onBackgroundMessage((payload) => {
    console.log('📢 Notificação recebida em background:', payload);
    
    const notificationTitle = payload.notification?.title || '🆕 Novo Pedido!';

    // CONFIGURAÇÃO DA NOTIFICAÇÃO
    const notificationOptions = {
      body: payload.notification?.body || 'Há um novo pedido disponível para entrega',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      image: payload.notification?.image,
      data: {
        ...payload.data,
        som: SOM_PRINCIPAL // Incluir som nos dados
      },
      tag: 'novo-pedido',
      requireInteraction: true,
      silent: false, // ✅ COM ÁUDIO DO SISTEMA (funciona sempre)
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'view',
          title: '📋 Ver Pedido'
        },
        {
          action: 'dismiss',
          title: '❌ Fechar'
        }
      ]
    };

    console.log('🔊 Notificação com áudio do sistema');

    // MOSTRAR NOTIFICAÇÃO
    return self.registration.showNotification(notificationTitle, notificationOptions)
      .then(() => {
        console.log('✅ Notificação exibida');
      })
      .catch((error) => {
        console.error('❌ Erro ao exibir notificação:', error);
      });
  });

  // ============================================================================
  // 2. CLICK NA NOTIFICAÇÃO - COM ÁUDIO PERSONALIZADO
  // ============================================================================
  self.addEventListener('notificationclick', (event) => {
    console.log('👆 Notificação clicada:', event.notification);
    
    // ✅ REPRODUZIR SOM NO CLICK (após interação do usuário)
    try {
      const som = event.notification.data?.som || SOM_PRINCIPAL;
      console.log('🎵 Tocando som:', som);
      
      // Criar áudio com fallback
      const audio = new Audio();
      audio.src = som;
      audio.volume = 0.6;
      
      audio.play()
        .then(() => console.log('🔊 Som personalizado tocado'))
        .catch(e => {
          console.log('🔇 Fallback para som do sistema');
          // Se falhar, pelo menos o som do sistema já tocou
        });
    } catch (e) {
      console.log('❌ Erro no áudio:', e);
    }

    event.notification.close();

    // REDIRECIONAMENTO (seu código existente)
    const payloadData = event.notification.data;
    let targetUrl = '/pedidos-pendentes';
    
    if (payloadData && payloadData.tipo === 'pedido_aceito') {
      targetUrl = '/pedidos-aceitos';
    } else if (payloadData && payloadData.tipo === 'pedido_entregue') {
      targetUrl = '/pedidos-entregues';
    }

    if (event.action === 'view') {
      targetUrl = '/pedidos-pendentes';
    } else if (event.action === 'dismiss') {
      console.log('❌ Notificação descartada');
      return;
    }

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
  // 3. EVENTOS DO SERVICE WORKER
  // ============================================================================
  self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker instalado');
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    console.log('🎯 Service Worker ativado');
    event.waitUntil(self.clients.claim());
  });

} catch (error) {
  console.error('💥 ERRO CRÍTICO no Service Worker:', error);
}

console.log('🚀 Service Worker carregado com sons locais!');