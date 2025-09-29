// lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ✅ INICIALIZAÇÃO SEGURA COM TRY/CATCH
let messaging = null;
let app = null;

if (typeof window !== 'undefined') {
  try {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    console.log('✅ Firebase inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error);
  }
}

// ✅ FUNÇÃO MELHORADA COM SERVICE WORKER CORRETO
export const requestForToken = async () => {
  if (!messaging) {
    console.log('⚠️ Messaging não disponível');
    return null;
  }

  try {
    // ✅ VERIFICAR SERVICE WORKER
    if (!('serviceWorker' in navigator)) {
      console.log('❌ Service Worker não suportado');
      return null;
    }

    // ✅ REGISTRAR/OBTER SERVICE WORKER ESPECÍFICO PARA FCM
    let registration;
    try {
      // Tentar obter o service worker existente
      registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      
      if (!registration) {
        // Registrar se não existir
        console.log('🔄 Registrando Service Worker específico para FCM...');
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        
        // Aguardar ativação
        if (registration.installing) {
          await new Promise(resolve => {
            registration.installing.addEventListener('statechange', (e) => {
              if (e.target.state === 'activated') {
                resolve();
              }
            });
          });
        }
      }
      
      console.log('✅ Service Worker FCM registrado:', registration);
    } catch (swError) {
      console.error('❌ Erro no Service Worker:', swError);
      return null;
    }

    // ✅ OBTER TOKEN COM SERVICE WORKER ESPECÍFICO
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (currentToken) {
      console.log('✅ Token FCM obtido com sucesso:', currentToken.substring(0, 50) + '...');
      return currentToken;
    } else {
      console.log('❌ Não foi possível obter token FCM - verifique permissões');
      return null;
    }
  } catch (error) {
    console.error('❌ Erro crítico ao obter token FCM:', error);
    
    // ✅ DETALHES DO ERRO
    if (error.code === 'messaging/permission-blocked') {
      console.error('🔒 Permissão de notificação bloqueada pelo usuário');
    } else if (error.code === 'messaging/permission-default') {
      console.error('⏳ Permissão de notificação não solicitada ainda');
    } else if (error.code === 'messaging/invalid-sw-registration') {
      console.error('🔄 Service Worker registration inválido');
    }
    
    return null;
  }
};

// ✅ LISTENER MELHORADO PARA MENSAGENS EM FOREGROUND
export const onMessageListener = () => {
  return new Promise((resolve, reject) => {
    if (!messaging) {
      reject(new Error('Messaging não disponível'));
      return;
    }
    
    try {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('📩 Mensagem recebida em foreground:', payload);
        resolve(payload);
      });
    } catch (error) {
      console.error('❌ Erro no listener de mensagens:', error);
      reject(error);
    }
  });
};

// ✅ FUNÇÃO PARA VERIFICAR PERMISSÕES
export const checkNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return 'not-supported';
  }
  
  return Notification.permission;
};

// ✅ FUNÇÃO PARA SOLICITAR PERMISSÃO
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return 'not-supported';
  }
  
  try {
    const permission = await Notification.requestPermission();
    console.log('🔔 Permissão de notificação:', permission);
    return permission;
  } catch (error) {
    console.error('❌ Erro ao solicitar permissão:', error);
    return 'denied';
  }
};

export { messaging, app };