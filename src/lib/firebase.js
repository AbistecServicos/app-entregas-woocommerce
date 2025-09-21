// lib/firebase.js - VERSÃO CORRIGIDA
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCQbJZQ1RP2VJvQOqUTDp-rvxCSN_cf4ZQ",
  authDomain: "entregaswoonotificacoes.firebaseapp.com",
  projectId: "entregaswoonotificacoes",
  storageBucket: "entregaswoonotificacoes.firebasestorage.app",
  messagingSenderId: "185849507222",
  appId: "1:185849507222:web:02ecd0936086cc7a5dc1b7"
};

// Variáveis globais
let app = null;
let messaging = null;

// Só inicializa no navegador (evita erro no servidor)
if (typeof window !== 'undefined') {
  try {
    app = initializeApp(firebaseConfig);
    
    // Verifica se o navegador suporta Firebase Messaging
    isSupported().then(supported => {
      if (supported) {
        messaging = getMessaging(app);
        console.log('Firebase Messaging inicializado!');
      } else {
        console.log('Firebase Messaging não suportado neste navegador');
      }
    }).catch(error => {
      console.log('Erro ao verificar suporte:', error);
    });
    
  } catch (error) {
    console.log('Erro ao inicializar Firebase:', error);
  }
}

// Solicitar permissão para notificações
export const requestForToken = () => {
  return new Promise(async (resolve) => {
    if (typeof window === 'undefined' || !messaging) {
      console.log('Firebase não disponível');
      resolve(null);
      return;
    }

    try {
      const currentToken = await getToken(messaging, { 
        vapidKey: "BBI4OTlcRQahrvbbC_XGTak7Xae9Q9zVt5mCte7w-zuy2xVAmcNWqv2Fxt_rDmhKJggNdsyJ8P-9dMt3LImstxw"
      });
      
      if (currentToken) {
        console.log('Token atual para cliente: ', currentToken);
        resolve(currentToken);
      } else {
        console.log('Nenhum token de registro disponível.');
        resolve(null);
      }
    } catch (error) {
      console.log('Erro ao recuperar token: ', error);
      resolve(null);
    }
  });
};

// Listener para mensagens em foreground
export const onMessageListener = () => {
  return new Promise((resolve) => {
    if (!messaging) {
      resolve(null);
      return;
    }

    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};

export { messaging };
export default app;