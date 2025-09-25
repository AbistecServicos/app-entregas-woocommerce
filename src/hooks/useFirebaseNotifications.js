// src/hooks/useFirebaseNotifications.js
import { useState, useEffect } from 'react';
import { messaging, requestForToken, onMessageListener } from '../../lib/firebase';
import { supabase } from '../../lib/supabase';

export const useFirebaseNotifications = (userId) => {
  // ✅ VALORES PADRÃO DEFINIDOS
  const [token, setToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    // ✅ VERIFICAR SUPORTE CORRETAMENTE
    const checkSupport = () => {
      if (typeof window !== 'undefined' && 
          'serviceWorker' in navigator && 
          'PushManager' in window) {
        setIsSupported(true);
        setPermission(Notification.permission);
      }
    };
    
    checkSupport();
  }, []);

  // ✅ SOLICITAR PERMISSÃO COM TRATAMENTO DE ERRO
  useEffect(() => {
    if (!isSupported || !userId) return;

    const initializeNotifications = async () => {
      try {
        console.log('🔔 Inicializando notificações para usuário:', userId);
        
        // ✅ AGUARDAR SERVICE WORKER ESTAR PRONTO
        if (navigator.serviceWorker.controller) {
          console.log('✅ Service Worker já está controlando a página');
        } else {
          // Registrar service worker se não estiver registrado
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('✅ Service Worker registrado:', registration);
        }

        await navigator.serviceWorker.ready;
        console.log('✅ Service Worker pronto para uso');
        
        const currentPermission = await Notification.requestPermission();
        setPermission(currentPermission);
        
        if (currentPermission === 'granted') {
          const currentToken = await requestForToken();
          
          if (currentToken) {
            setToken(currentToken);
            console.log('✅ Token FCM obtido:', currentToken.substring(0, 50) + '...');

            // Salvar token no Supabase
            const { error } = await supabase
              .from('user_tokens')
              .upsert({
                user_id: userId,
                token: currentToken,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id,token'
              });

            if (error) {
              console.error('❌ Erro ao salvar token:', error);
            } else {
              console.log('✅ Token salvo no Supabase');
            }
          } else {
            console.log('⚠️ Não foi possível obter token FCM');
          }
        } else {
          console.log('❌ Permissão de notificação negada:', currentPermission);
        }
      } catch (error) {
        console.error('❌ Erro na inicialização de notificações:', error);
      }
    };

    initializeNotifications();
  }, [userId, isSupported]);

  // ✅ ESCUTAR MENSAGENS EM FOREGROUND
  useEffect(() => {
    if (!isSupported) return;

    onMessageListener()
      .then((payload) => {
        console.log('📩 Notificação recebida em foreground:', payload);
        setNotification(payload);

        // Mostrar notificação mesmo em foreground
        if (payload.notification && Notification.permission === 'granted') {
          const { title, body } = payload.notification;
          new Notification(title, {
            body,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            data: payload.data || {}
          });
        }
      })
      .catch((error) => {
        console.error('❌ Erro no listener de mensagens:', error);
      });
  }, [isSupported]);

  // ✅ RETORNAR VALORES PADRÃO SEMPRE
  return { 
    token, 
    notification, 
    isSupported,
    permission
  };
};