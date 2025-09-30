import { useState, useEffect } from 'react';
import { getMessaging, getToken, onMessage, isSupported as isMessagingSupported } from 'firebase/messaging';
import { app } from '../../lib/firebase';
import { supabase } from '../../lib/supabase';

export const useFirebaseNotifications = (userId) => {
  const [token, setToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isInitializing, setIsInitializing] = useState(false);

  // ✅ VERIFICAR SUPORTE
  useEffect(() => {
    const checkSupport = () => {
      if (typeof window === 'undefined') return;

      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasPushManager = 'PushManager' in window;
      const hasNotification = 'Notification' in window;

      if (hasServiceWorker && hasPushManager && hasNotification) {
        setIsSupported(true);
        setPermission(Notification.permission);
        console.log('🔔 Sistema de notificações suportado');
      }
    };
    
    checkSupport();
  }, []);

  // ✅ REGISTRAR SERVICE WORKER
  const registerServiceWorker = async () => {
    try {
      if (!('serviceWorker' in navigator)) return null;

      const existingRegistration = await navigator.serviceWorker.getRegistration();
      if (existingRegistration) return existingRegistration;

      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });

      if (registration.installing) {
        await new Promise((resolve) => {
          registration.installing.addEventListener('statechange', (e) => {
            if (e.target.state === 'activated') resolve();
          });
          setTimeout(() => resolve(), 3000);
        });
      }

      return registration;
    } catch (error) {
      console.error('❌ Erro no Service Worker:', error);
      return null;
    }
  };

  // ✅ OBTER TOKEN FCM
  const getFCMToken = async () => {
    try {
      if (!app) return null;

      const messaging = getMessaging(app);
      const messagingSupported = await isMessagingSupported();
      if (!messagingSupported) return null;

      const currentToken = await getToken(messaging, {
        vapidKey: 'BCd-maal1lq3H0NRBlVoDkmM1ln0kTMBg1f8x_q4k1Gv-Lsapf9YN6Rr-zczZGYNtIR8qWPNkF9ZDCOiDKNu1S8',
        serviceWorkerRegistration: await navigator.serviceWorker.ready
      });

      return currentToken;
    } catch (error) {
      console.error('❌ Erro ao obter token FCM:', error);
      return null;
    }
  };

  // ✅ SALVAR TOKEN NO SUPABASE
  const saveTokenToSupabase = async (userId, token) => {
    try {
      const { error } = await supabase
        .from('user_tokens')
        .upsert({
          user_id: userId,
          token: token,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,token'
        });

      if (error) {
        console.error('❌ Erro ao salvar token:', error);
        return false;
      }
      
      console.log('✅ Token FCM salvo');
      return true;
    } catch (error) {
      console.error('❌ Erro Supabase:', error);
      return false;
    }
  };

  // ✅ LIMPAR TOKENS INVÁLIDOS
  const cleanupInvalidTokens = async () => {
    try {
      const { data: allTokens, error } = await supabase
        .from('user_tokens')
        .select('*');
      
      if (error) return;

      for (const tokenRecord of allTokens) {
        if (tokenRecord.token.includes('fnp7RLXzTy-0dPbJ4_wv')) {
          await supabase
            .from('user_tokens')
            .delete()
            .eq('token', tokenRecord.token);
        }
      }
    } catch (error) {
      console.error('❌ Erro na limpeza de tokens:', error);
    }
  };

  // ✅ INICIALIZAR NOTIFICAÇÕES
  useEffect(() => {
    if (!isSupported || !userId || isInitializing) return;

    const initializeNotifications = async () => {
      setIsInitializing(true);

      try {
        await cleanupInvalidTokens();
        await registerServiceWorker();
        await navigator.serviceWorker.ready;

        let currentPermission = Notification.permission;
        if (currentPermission === 'default') {
          currentPermission = await Notification.requestPermission();
        }
        
        setPermission(currentPermission);
        
        if (currentPermission !== 'granted') {
          setIsInitializing(false);
          return;
        }

        const fcmToken = await getFCMToken();
        
        if (fcmToken) {
          setToken(fcmToken);
          await saveTokenToSupabase(userId, fcmToken);
          console.log('🎯 Notificações configuradas');
        }

      } catch (error) {
        console.error('❌ Erro nas notificações:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeNotifications();
  }, [userId, isSupported, isInitializing]);

  // ✅ LISTENER DE MENSAGENS EM FOREGROUND
  useEffect(() => {
    if (!isSupported || !userId || !app) return;

    const setupMessageListener = () => {
      try {
        const messaging = getMessaging(app);
        
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('📩 Nova notificação:', payload.notification?.title);
          setNotification(payload);

          // Mostrar notificação em foreground
          if (payload.notification && Notification.permission === 'granted') {
            const { title, body } = payload.notification;
            
            try {
              new Notification(title, {
                body,
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
                data: payload.data || {},
                tag: `fg-${Date.now()}`,
                requireInteraction: true
              });
            } catch (error) {
              console.error('❌ Erro na notificação:', error);
            }
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('❌ Erro no listener:', error);
      }
    };

    const unsubscribe = setupMessageListener();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId, isSupported, app]);

  // ✅ DEBUG: LOG APENAS QUANDO NOTIFICAÇÃO CHEGAR
  useEffect(() => {
    if (notification) {
      console.log('🎉 NOTIFICAÇÃO RECEBIDA:', {
        title: notification.notification?.title,
        body: notification.notification?.body,
        data: notification.data
      });
    }
  }, [notification]);

  return { 
    token, 
    notification, 
    isSupported,
    permission,
    isInitializing
  };
};