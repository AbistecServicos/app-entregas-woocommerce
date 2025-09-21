// hooks/useFirebaseNotifications.js
import { useState, useEffect } from 'react';
import { messaging, requestForToken, onMessageListener } from '../lib/firebase';
import { supabase } from '../lib/supabase';

// ==============================================================================
// HOOK PERSONALIZADO PARA GERENCIAR NOTIFICAÇÕES DO FIREBASE
// ==============================================================================
/**
 * Hook para gerenciar notificações push do Firebase
 * 
 * @param {string} userId - ID do usuário autenticado (opcional)
 * @returns {Object} - Token e notificação atual
 */
export const useFirebaseNotifications = (userId) => {
  // ============================================================================
  // 1. ESTADOS DO HOOK
  // ============================================================================
  const [token, setToken] = useState(null);
  const [notification, setNotification] = useState(null);

  // ============================================================================
  // 2. EFFECT: SOLICITAR PERMISSÃO E OBTER TOKEN
  // ============================================================================
  useEffect(() => {
    if (userId && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const getToken = async () => {
        try {
          const currentToken = await requestForToken();
          if (currentToken) {
            setToken(currentToken);
            
            console.log('✅ Token FCM obtido:', currentToken);
            
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
              console.log('✅ Token salvo no Supabase com sucesso!');
            }
          }
        } catch (error) {
          console.error('❌ Erro ao obter token:', error);
        }
      };

      getToken();
    }
  }, [userId]);

  // ============================================================================
  // 3. EFFECT: ESCUTAR MENSAGENS EM FOREGROUND
  // ============================================================================
  useEffect(() => {
    if (typeof window !== 'undefined') {
      onMessageListener()
        .then((payload) => {
          console.log('📩 Mensagem em foreground recebida:', payload);
          setNotification(payload);
        })
        .catch((error) => console.log('❌ Erro no listener: ', error));
    }
  }, []);

  // ============================================================================
  // 4. RETORNO DO HOOK
  // ============================================================================
  return { token, notification };
};