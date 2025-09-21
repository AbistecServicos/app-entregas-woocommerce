import { useState, useEffect } from 'react';
import { messaging, requestForToken, onMessageListener } from '../lib/firebase';
import { supabase } from '../lib/supabase';

export const useFirebaseNotifications = (userId) => {
  const [token, setToken] = useState(null);
  const [notification, setNotification] = useState(null);

  // Solicitar permissão e obter token
  useEffect(() => {
    if (userId && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const getToken = async () => {
        try {
          const currentToken = await requestForToken();
          if (currentToken) {
            setToken(currentToken);
            
            // Salvar token no Supabase
            const { error } = await supabase
              .from('user_tokens')
              .upsert({
                user_id: userId,
                token: currentToken,
                updated_at: new Date().toISOString()
              });
            
            if (error) {
              console.error('Erro ao salvar token:', error);
            }
          }
        } catch (error) {
          console.error('Erro ao obter token:', error);
        }
      };

      getToken();
    }
  }, [userId]);

  // Escutar mensagens em foreground
  useEffect(() => {
    if (typeof window !== 'undefined') {
      onMessageListener()
        .then((payload) => {
          setNotification(payload);
          // Mostrar notificação mesmo em foreground se desejar
          if (payload.notification) {
            new Notification(payload.notification.title, {
              body: payload.notification.body,
              icon: payload.notification.icon || '/icon-192x192.png'
            });
          }
        })
        .catch((error) => console.log('Erro no listener: ', error));
    }
  }, []);

  return { token, notification };
};