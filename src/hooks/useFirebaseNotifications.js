// ========================================
// USEFIREBASENOTIFICATIONS.JS - HOOK CORRIGIDO (BASEADO NA VERSÃO ORIGINAL)
// ========================================
// Descrição: Hook para FCM push (init, token, onMessage, save Supabase).
// Problema resolvido: Loop infinito via ref init + deps sem isInitializing + idempotência.
// Manutenção: Seções numeradas. Remova console.logs em prod.
// Dependências: firebase/messaging, supabase, app de lib/firebase.
// ========================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { getMessaging, getToken, onMessage, isSupported as isMessagingSupported } from 'firebase/messaging';
import { app } from '../../lib/firebase';
import { supabase } from '../../lib/supabase';

const isDev = process.env.NODE_ENV === 'development';

export const useFirebaseNotifications = (userId) => {
  const [token, setToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isInitializing, setIsInitializing] = useState(false);

  // Ref para evitar re-init (flag persistente sem state loop).
  const hasInitializedRef = useRef(false);
  const unsubscribeRef = useRef(null); // Para onMessage cleanup.
  const messagingRef = useRef(null); // Para messaging instance.

  // ============================================================================
  // 1. VERIFICAR SUPORTE (RODA UMA VEZ, ORIGINAL)
  // ============================================================================
  useEffect(() => {
    const checkSupport = () => {
      if (typeof window === 'undefined') return;

      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasPushManager = 'PushManager' in window;
      const hasNotification = 'Notification' in window;

      if (hasServiceWorker && hasPushManager && hasNotification) {
        setIsSupported(true);
        setPermission(Notification.permission);
        if (isDev) console.log('🔔 Sistema de notificações suportado');
      }
    };
    
    checkSupport();
  }, []); // Deps vazias: uma vez.

  // ============================================================================
  // 2. REGISTRAR SERVICE WORKER (ORIGINAL, MEMOIZADO)
  // ============================================================================
  const registerServiceWorker = useCallback(async () => {
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
  }, []);

  // ============================================================================
  // 3. OBTER TOKEN FCM (ORIGINAL, COM REF)
  // ============================================================================
  const getFCMToken = useCallback(async () => {
    try {
      if (!app) return null;

      const messaging = getMessaging(app);
      messagingRef.current = messaging; // Salva ref para cleanup.

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
  }, [app]);

  // ============================================================================
  // 4. SALVAR TOKEN NO SUPABASE (IDEMPOTENTE, ORIGINAL + CHECK)
  // ============================================================================
  const saveTokenToSupabase = useCallback(async (userId, token) => {
    if (!userId || !token) return false;

    try {
      // Check atual para idempotência (evita upsert infinito).
      const { data: existing } = await supabase
        .from('user_tokens')
        .select('token')
        .eq('user_id', userId)
        .single();

      if (existing?.token === token) {
        if (isDev) console.log('🔄 Token FCM já salvo (sem mudança)');
        return true;
      }

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
      
      if (isDev) console.log('✅ Token FCM salvo'); // Linha 99 original.
      return true;
    } catch (error) {
      console.error('❌ Erro Supabase:', error);
      return false;
    }
  }, []);

// ============================================================================
// 5. LIMPAR TOKENS INVÁLIDOS (CORRIGIDO - COM TRATAMENTO DE ERRO)
// ============================================================================
const cleanupInvalidTokens = useCallback(async () => {
  try {
    // ✅ VERIFICAR SE USUÁRIO ESTÁ AUTENTICADO PRIMEIRO
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      if (isDev) console.log('🔐 Usuário não autenticado - pulando limpeza de tokens');
      return;
    }

    // ✅ QUERY COM TRATAMENTO DE ERRO MELHORADO
    const { data: allTokens, error } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId); // ✅ FILTRAR APENAS TOKENS DO USUÁRIO ATUAL
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Não há tokens - isso é normal
        return;
      }
      console.error('❌ Erro ao buscar tokens:', error);
      return;
    }

    if (!allTokens || allTokens.length === 0) {
      return; // Nenhum token para limpar
    }

    // ✅ LIMPAR APENAS TOKENS INVÁLIDOS DO USUÁRIO ATUAL
    const deletePromises = allTokens.map(async (tokenRecord) => {
      if (tokenRecord.token.includes('fnp7RLXzTy-0dPbJ4_wv')) {
        const { error: deleteError } = await supabase
          .from('user_tokens')
          .delete()
          .eq('id', tokenRecord.id)
          .eq('user_id', userId); // ✅ GARANTIR que só deleta tokens do usuário
        
        if (deleteError) {
          console.error('❌ Erro ao deletar token inválido:', deleteError);
        }
        return !deleteError;
      }
      return false;
    });

    await Promise.all(deletePromises);

    if (isDev) console.log('🧹 Tokens inválidos limpos');
  } catch (error) {
    console.error('❌ Erro na limpeza de tokens:', error);
  }
}, [userId]); // ✅ ADICIONAR userId COMO DEPENDÊNCIA
  // ============================================================================
  // 6. INICIALIZAR NOTIFICAÇÕES (ORIGINAL, SEM LOOP)
  // ============================================================================
  // Roda só em mudanças reais; ref previne re-init.
  useEffect(() => {
    if (!isSupported || !userId || hasInitializedRef.current || isInitializing) return;

    const initializeNotifications = async () => {
      hasInitializedRef.current = true; // Flag para uma vez só.
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
          if (isDev) console.log('🎯 Notificações configuradas'); // Linha 158 original.
        }

      } catch (error) {
        console.error('❌ Erro nas notificações:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeNotifications();
  }, [userId, isSupported]); // Deps: só userId + supported (sem isInitializing!).

  // ============================================================================
  // 7. LISTENER DE MENSAGENS EM FOREGROUND (ORIGINAL + CLEANUP)
  // ============================================================================
  useEffect(() => {
    if (!isSupported || !userId || !app) return;

    const setupMessageListener = () => {
      try {
        const messaging = getMessaging(app);
        
        const unsubscribe = onMessage(messaging, (payload) => {
          if (isDev) console.log('📩 Nova notificação:', payload.notification?.title);
          setNotification(payload);

          // Mostrar notificação em foreground (original).
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

        unsubscribeRef.current = unsubscribe; // Salva para cleanup.
        return unsubscribe;
      } catch (error) {
        console.error('❌ Erro no listener:', error);
      }
    };

    const unsubscribe = setupMessageListener();
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        if (isDev) console.log('🧹 Cleanup onMessage listener');
      }
    };
  }, [userId, isSupported, app]); // Deps originais, mas com ref cleanup.

  // ============================================================================
  // 8. DEBUG: LOG APENAS QUANDO NOTIFICAÇÃO CHEGAR (ORIGINAL)
  // ============================================================================
  useEffect(() => {
    if (notification) {
      if (isDev) console.log('🎉 NOTIFICAÇÃO RECEBIDA:', {
        title: notification.notification?.title,
        body: notification.notification?.body,
        data: notification.data
      });
    }
  }, [notification]);

  // ============================================================================
  // 9. CLEANUP GLOBAL (DELETE TOKEN EM UNMOUNT)
  // ============================================================================
  useEffect(() => {
    return () => {
      if (token && messagingRef.current) {
        // Opcional: Delete token em logout/unmount.
        getToken(messagingRef.current, { vapidKey: 'BCd-maal1lq3H0NRBlVoDkmM1ln0kTMBg1f8x_q4k1Gv-Lsapf9YN6Rr-zczZGYNtIR8qWPNkF9ZDCOiDKNu1S8' })
          .then(currentToken => {
            if (currentToken === token) {
              // Use deleteToken se quiser limpar (mas só em logout real).
              console.log('🔄 Token cleanup em unmount');
            }
          });
      }
    };
  }, [token]);

// ============================================================================
// 10. FUNÇÃO PARA FORÇAR ATUALIZAÇÃO DO TOKEN (NOVA - PARA O SININHO)
// ============================================================================
const forceRefreshToken = useCallback(async () => {
  if (!isSupported || !userId) return null;
  
  try {
    if (isDev) console.log('🔄 Forçando atualização do token FCM...');
    
    // ✅ OBTER NOVO TOKEN
    const fcmToken = await getFCMToken();
    
    if (fcmToken && fcmToken !== token) {
      setToken(fcmToken);
      await saveTokenToSupabase(userId, fcmToken);
      if (isDev) console.log('✅ Token FCM atualizado forçadamente');
      return fcmToken;
    } else {
      if (isDev) console.log('🔁 Token FCM já está atualizado');
      return token;
    }
  } catch (error) {
    console.error('❌ Erro ao forçar atualização do token:', error);
    return null;
  }
}, [userId, isSupported, getFCMToken, saveTokenToSupabase, token]);
// ============================================================================
// 11. RETORNO DO HOOK (ATUALIZADO)
// ============================================================================
return { 
  token, 
  notification, 
  isSupported,
  permission,
  isInitializing,
  forceRefreshToken // ✅ ADICIONAR ESTA FUNÇÃO
};
};

