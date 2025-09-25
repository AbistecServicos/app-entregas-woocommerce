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

if (typeof window !== 'undefined') {
  try {
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    console.log('✅ Firebase inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error);
  }
}

// ✅ FUNÇÃO MELHORADA COM MAIS CONTROLE DE ERROS
export const requestForToken = async () => {
  if (!messaging) {
    console.log('⚠️ Messaging não disponível (possivelmente no servidor)');
    return null;
  }

  try {
    // ✅ VERIFICAR SE SERVICE WORKER É SUPORTADO
    if (!('serviceWorker' in navigator)) {
      console.log('❌ Service Worker não suportado neste navegador');
      return null;
    }

    // ✅ AGUARDAR SERVICE WORKER ESTAR PRONTO
    const registration = await navigator.serviceWorker.ready;
    console.log('✅ Service Worker pronto para uso');

    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration // ✅ IMPORTANTE
    });

    if (currentToken) {
      console.log('✅ Token FCM obtido com sucesso');
      return currentToken;
    } else {
      console.log('⚠️ Não foi possível obter token FCM');
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao obter token FCM:', error);
    
    // ✅ LOG MAIS DETALHADO PARA DEBUG
    if (error.message.includes('messaging/service-worker-not-registered')) {
      console.error('💡 Dica: Service Worker não registrado. Verifique o firebase-messaging-sw.js');
    }
    
    return null;
  }
};

// ✅ LISTENER SEGURO
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) {
      resolve(null);
      return;
    }
    
    try {
      onMessage(messaging, (payload) => resolve(payload));
    } catch (error) {
      console.error('❌ Erro no listener de mensagens:', error);
      resolve(null);
    }
  });

export { messaging };