// lib/firebase.js
// ==========================================================
// 1. IMPORTS DO SDK MODULAR PARA WEB
// ==========================================================
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// ==========================================================
// 2. CONFIGURAÇÃO (usa variáveis do .env.local)
// ==========================================================
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ==========================================================
// 3. INICIALIZAÇÃO DO APP (apenas no navegador)
// ==========================================================
let messaging = null;

if (typeof window !== 'undefined') {
  const app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
}

// ==========================================================
// 4. FUNÇÕES AUXILIARES
// ==========================================================

// Solicitar token do navegador
export const requestForToken = async () => {
  if (!messaging) return null;
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });
    return currentToken;
  } catch (err) {
    console.error('Erro ao obter token:', err);
    return null;
  }
};

// Listener de mensagens em foreground
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => resolve(payload));
  });

export { messaging };
