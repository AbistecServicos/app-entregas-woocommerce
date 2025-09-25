// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// 🔥 USE AS MESMAS CONFIGURAÇÕES DO SEU .env.local
firebase.initializeApp({
  apiKey: "AIzaSyCQbJZQ1RP2VJvQOqUTDp-rvxCSN_cf4ZQ",
  authDomain: "entregaswoonotificacoes.firebaseapp.com",
  projectId: "entregaswoonotificacoes",
  storageBucket: "entregaswoonotificacoes.firebasestorage.app",
  messagingSenderId: "185849507222",
  appId: "1:185849507222:web:02ecd0936086cc7a5dc1b7"
});

const messaging = firebase.messaging();

// ✅ CONFIGURAÇÃO IMPORTANTE: Definir background handler
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Notificação em background:', payload);
  
  const notificationTitle = payload.notification?.title || 'Novo Pedido';
  const notificationOptions = {
    body: payload.notification?.body || 'Você tem um novo pedido disponível',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: payload.data || {}
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// ✅ CLICK HANDLER
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada:', event.notification);
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/pedidos-pendentes') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/pedidos-pendentes');
      }
    })
  );
});

console.log('[SW] Service Worker carregado com sucesso!');