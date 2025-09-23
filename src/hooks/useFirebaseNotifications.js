// src/hooks/useFirebaseNotifications.js
import { useState, useEffect } from 'react';
import { messaging, requestForToken, onMessageListener } from '../../lib/firebase';
import { supabase } from '../../lib/supabase';

export const useFirebaseNotifications = (userId) => {
  const [token, setToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  // ✅ VERIFICAR SUPORTE DO NAVEGADOR
  useEffect(() => {
    if (typeof window !== 'undefined' && 
        'serviceWorker' in navigator && 
        'PushManager' in window) {
      setIsSupported(true);
    }
  }, []);

  // ✅ SOLICITAR PERMISSÃO E OBTER TOKEN
  useEffect(() => {
    if (!isSupported || !userId) return;

    const initializeNotifications = async () => {
      try {
        // Verificar se já temos permissão
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          const currentToken = await requestForToken();
          
          if (currentToken) {
            setToken(currentToken);
            console.log('✅ Token FCM obtido:', currentToken);

            // ✅ SALVAR TOKEN NO SUPABASE
            const { error } = await supabase
              .from('user_tokens')
              .upsert(
                {
                  user_id: userId,
                  token: currentToken,
                  updated_at: new Date().toISOString()
                },
                { 
                  onConflict: 'user_id,token',
                  ignoreDuplicates: false 
                }
              );

            if (error) {
              console.error('❌ Erro ao salvar token:', error);
            } else {
              console.log('✅ Token salvo/atualizado no Supabase');
            }
          }
        } else {
          console.warn('❌ Permissão para notificações negada');
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
        console.log('📩 Mensagem em foreground:', payload);
        setNotification(payload);

        // ✅ MOSTRAR NOTIFICAÇÃO MESMO EM FOREGROUND
        if (payload.notification && Notification.permission === 'granted') {
          const { title, body, icon } = payload.notification;
          
          new Notification(title, {
            body,
            icon: icon || '/icon-192x192.png',
            badge: '/icon-192x192.png',
            data: payload.data || {}
          });
        }
      })
      .catch((error) => {
        console.error('❌ Erro no listener de mensagens:', error);
      });
  }, [isSupported]);

  return { 
    token, 
    notification, 
    isSupported,
    permission: typeof window !== 'undefined' ? Notification.permission : 'default'
  };
};