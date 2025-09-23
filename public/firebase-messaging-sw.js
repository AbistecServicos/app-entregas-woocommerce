// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// ✅ USE SUAS VARIÁVEIS DE AMBIENTE (as mesmas do firebase.js)
firebase.initializeApp({
  apiKey: "AIzaSyCQbJZQ1RP2VJvQOqUTDp-rvxCSN_cf4ZQ",
  authDomain: "entregaswoonotificacoes.firebaseapp.com",
  projectId: "entregaswoonotificacoes",
  storageBucket: "entregaswoonotificacoes.firebasestorage.app",
  messagingSenderId: "185849507222",
  appId: "1:185849507222:web:02ecd0936086cc7a5dc1b7"
});

const messaging = firebase.messaging();

// ✅ BACKGROUND MESSAGE HANDLER (Quando app está fechado)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'Novo Pedido';
  const notificationOptions = {
    body: payload.notification?.body || 'Você tem uma nova notificação',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: payload.data || {} // Passa dados para quando clicar na notificação
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ✅ CLICK HANDLER (Quando usuário clica na notificação)
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification);
  
  event.notification.close();
  
  // Abre/foca a aplicação
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Tenta focar em uma janela existente
        for (const client of clientList) {
          if (client.url.includes('/') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Se não encontrou, abre nova janela
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});