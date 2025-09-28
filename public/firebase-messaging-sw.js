// /public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.0/firebase-messaging-compat.js');

// ==============================================================================
// CONFIGURAÇÃO DO FIREBASE NO SERVICE WORKER
// ==============================================================================

// ✅ SUBSTITUA ESTAS CONFIGURAÇÕES PELAS SUAS DO FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyCQbJZQ1RP2VJvQOqUTDp-rvxCSN_cf4ZQ", // Sua chave API real
  authDomain: "entregaswoonotificacoes.firebaseapp.com",
  projectId: "entregaswoonotificacoes",
  storageBucket: "entregaswoonotificacoes.appspot.com",
  messagingSenderId: "185849507222",
  appId: "1:185849507222:web:02ecd0936086cc7a5dc1b7"
};

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
    
    const notificationTitle = payload.notification?.title || 'Novo Pedido!';
    const notificationOptions = {
      body: payload.notification?.body || 'Há um novo pedido disponível para entrega',
      icon: '/icon-192x192.png',        // ✅ CORRIGIDO
      badge: '/icon-192x192.png',       // ✅ CORRIGIDO (usa mesmo ícone)
      image: payload.notification?.image,
      data: payload.data || {},
      tag: 'novo-pedido', // Agrupa notificações similares
      requireInteraction: true, // Mantém visível até interação
      actions: [
        {
          action: 'view',
          title: '📋 Ver Pedidos'
        },
        {
          action: 'dismiss',
          title: '❌ Fechar'
        }
      ]
    };

    // ========================================================================
    // MOSTRAR NOTIFICAÇÃO NO SISTEMA
    // ========================================================================
    return self.registration.showNotification(notificationTitle, notificationOptions)
      .then(() => {
        console.log('✅ Notificação de background exibida com sucesso');
      })
      .catch((error) => {
        console.error('❌ Erro ao exibir notificação:', error);
      });
  });

  // ============================================================================
  // 2. CLICK NA NOTIFICAÇÃO
  // ============================================================================
  self.addEventListener('notificationclick', (event) => {
    console.log('👆 Notificação clicada:', event.notification);
    
    event.notification.close();

    const payloadData = event.notification.data;
    
    // Determinar URL baseada nos dados da notificação
    let targetUrl = '/pedidos-pendentes';
    
    if (payloadData && payloadData.tipo === 'pedido_aceito') {
      targetUrl = '/pedidos-aceitos';
    } else if (payloadData && payloadData.tipo === 'pedido_entregue') {
      targetUrl = '/pedidos-entregues';
    }

    // Ação específica baseada no botão clicado
    if (event.action === 'view') {
      targetUrl = '/pedidos-pendentes';
    } else if (event.action === 'dismiss') {
      console.log('❌ Notificação descartada');
      return;
    }

    // ========================================================================
    // ABRIR/FOCAR NA JANELA DO APP
    // ========================================================================
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          console.log(`🔍 Procurando clientes abertos... Encontrados: ${clientList.length}`);
          
          // Verificar se já existe uma janela aberta
          for (const client of clientList) {
            if (client.url.includes(targetUrl) && 'focus' in client) {
              console.log('🎯 Cliente encontrado, focando...');
              return client.focus();
            }
          }
          
          // Se não encontrou, abrir nova janela
          if (self.clients.openWindow) {
            console.log('🆕 Abrindo nova janela:', targetUrl);
            return self.clients.openWindow(targetUrl);
          }
        })
        .catch((error) => {
          console.error('❌ Erro ao abrir/focar janela:', error);
          // Fallback: tentar abrir mesmo com erro
          return self.clients.openWindow(targetUrl);
        })
    );
  });

  // ============================================================================
  // 3. FECHAMENTO DA NOTIFICAÇÃO
  // ============================================================================
  self.addEventListener('notificationclose', (event) => {
    console.log('📪 Notificação fechada:', event.notification);
    // Aqui você pode enviar métricas de engajamento se necessário
  });

  // ============================================================================
  // 4. INSTALAÇÃO DO SERVICE WORKER
  // ============================================================================
  self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker instalado');
    self.skipWaiting(); // Ativar imediatamente
  });

  self.addEventListener('activate', (event) => {
    console.log('🎯 Service Worker ativado');
    event.waitUntil(self.clients.claim()); // Controlar todas as páginas
  });

} catch (error) {
  console.error('💥 ERRO CRÍTICO no Service Worker:', error);
}

// ==============================================================================
// FUNÇÕES AUXILIARES
// ==============================================================================

/**
 * Converte payload do FCM para opções de notificação
 */
function payloadToNotificationOptions(payload) {
  const notification = payload.notification || {};
  const data = payload.data || {};
  
  return {
    body: notification.body || 'Nova mensagem do sistema',
    icon: notification.icon || '/icons/icon-192x192.png',
    image: notification.image,
    badge: '/icons/badge-72x72.png',
    data: data,
    tag: data.tipo || 'geral',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: '👀 Ver'
      },
      {
        action: 'dismiss', 
        title: '❌ Fechar'
      }
    ]
  };
}

console.log('🚀 Service Worker do Firebase carregado com sucesso!');