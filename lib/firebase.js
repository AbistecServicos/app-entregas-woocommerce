// ========================================
// LIB/FIREBASE.JS - CONFIGURAÇÃO OTIMIZADA
// ========================================
// Descrição: Init Firebase app + messaging para FCM (token, onMessage, permissions).
// Integração: Suporta hook notificações + SW; VAPID env para segurança.
// Melhoria: SW separado; subscription onMessage; retry token; deleteToken sem conflito.
// Manutenção: Seções numeradas. Alinha PDF (VAPID HS256 compat FCM).
// ========================================

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, deleteToken as firebaseDeleteToken } from 'firebase/messaging'; // ✅ ALIAS RENOMEADO: firebaseDeleteToken

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicialização segura (SSR-safe).
let app = null;
let messaging = null;

if (typeof window !== 'undefined') {
  try {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    console.log('✅ Firebase inicializado');
  } catch (error) {
    console.error('❌ Erro init Firebase:', error);
  }
}

export { app, messaging };

// ============================================================================
// 1. REGISTRAR SERVICE WORKER (SEPARADO PARA REUSE)
// ============================================================================
export const registerFCMServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.log('❌ SW não suportado');
    return null;
  }

  try {
    // Get existing ou register novo.
    let registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!registration) {
      console.log('🔄 Registrando SW FCM...');
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      // Wait activation.
      if (registration.installing) {
        await new Promise(resolve => {
          registration.installing.addEventListener('statechange', (e) => {
            if (e.target.state === 'activated') resolve();
          });
        });
      }
    }
    
    console.log('✅ SW FCM registrado:', registration);
    return registration;
  } catch (error) {
    console.error('❌ Erro SW:', error);
    return null;
  }
};

// ============================================================================
// 2. REQUEST FOR TOKEN (OTIMIZADO + RETRY + ENV VAPID)
// ============================================================================
export const requestForToken = async (retryCount = 3) => {
  if (!messaging) {
    console.log('⚠️ Messaging não disponível');
    return null;
  }

  // Get SW.
  const registration = await registerFCMServiceWorker();
  if (!registration) return null;

  // VAPID de env (segurança).
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.error('❌ VAPID_KEY não definida em env');
    return null;
  }

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      const currentToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration
      });

      if (currentToken) {
        console.log('✅ Token FCM obtido:', currentToken.substring(0, 50) + '...');
        return currentToken;
      }
    } catch (error) {
      console.error(`❌ Erro token (tentativa ${attempt}):`, error.code || error.message);
      if (error.code === 'messaging/permission-blocked') return null;
      if (attempt < retryCount) await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  console.log('❌ Token FCM falhou após retries');
  return null;
};

// ============================================================================
// 3. ON MESSAGE LISTENER (SUBSCRIPTION + UNSUBSCRIBE)
// ============================================================================
export const onMessageListener = (callback) => {
  if (!messaging) {
    console.error('❌ Messaging não disponível');
    return () => {}; // No-op unsubscribe.
  }
  
  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('📩 Mensagem foreground:', payload);
      if (callback) callback(payload);
    });
    console.log('✅ Listener onMessage ativo');
    return unsubscribe;
  } catch (error) {
    console.error('❌ Erro listener:', error);
    return () => {};
  }
};

// ============================================================================
// 4. CHECK/REQUEST PERMISSION (ORIGINAL + FALLBACK)
// ============================================================================
export const checkNotificationPermission = async () => {
  if (!('Notification' in window)) return 'not-supported';
  return Notification.permission;
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return 'not-supported';
  
  try {
    const permission = await Notification.requestPermission();
    console.log('🔔 Permissão:', permission);
    return permission;
  } catch (error) {
    console.error('❌ Erro permissão:', error);
    return 'denied';
  }
};

// ============================================================================
// 5. DELETE TOKEN (CLEANUP PARA LOGOUT) - SEM CONFLITO
// ============================================================================
export const deleteFCMToken = async () => { // ✅ NOME DIFERENTE DO ALIAS IMPORTADO
  if (!messaging) return;
  
  try {
    const registration = await registerFCMServiceWorker();
    if (!registration) return;
    
    await firebaseDeleteToken(messaging, { serviceWorkerRegistration: registration }); // ✅ USA ALIAS IMPORTADO
    console.log('🧹 Token FCM deletado');
  } catch (error) {
    console.error('❌ Erro delete token:', error);
  }
};