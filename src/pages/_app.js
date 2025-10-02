// ========================================
// _APP.JS - ROOT NEXT.JS OTIMIZADO
// ========================================
// Descrição: Inicializa app com auth Supabase + SW FCM; passa globals para Layout.
// Integração: Listener auth sync user/lojas; SW para sino (bell) notifications.
// Melhoria: Cleanup SW; logs dev-only; memo user; RLS-aware queries.
// Manutenção: Seções numeradas. Alinha PDF (anon_key RLS; HS256 FCM compat).
// ========================================

import { useState, useEffect, useMemo, useCallback } from 'react'; // ✅ ADICIONADO useCallback
import '../styles/globals.css';
import Layout from '../components/Layout';
import { supabase } from '../../lib/supabase'; // Anon_key implícito (RLS).

const isDev = process.env.NODE_ENV === 'development';

function MyApp({ Component, pageProps }) {
  // ============================================================================
  // 1. ESTADOS GLOBAIS
  // ============================================================================
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLojas, setUserLojas] = useState([]);

  // Memo user para estabilidade (evita re-renders desnecessários).
  const memoUser = useMemo(() => user, [user]);

  // ============================================================================
  // 2. REGISTRAR SERVICE WORKER (ORIGINAL + CLEANUP)
  // ============================================================================
  const registerServiceWorker = useCallback(async () => { // ✅ useCallback agora definido
    if (!('serviceWorker' in navigator)) {
      if (isDev) console.log('ℹ️ Navegador não suporta Service Worker');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
      
      if (isDev) console.log('✅ Service Worker registrado:', registration);
      
      // Monitor states.
      if (registration.installing) {
        if (isDev) console.log('🔄 SW instalando...');
        registration.installing.addEventListener('statechange', (e) => {
          if (isDev) console.log('📊 Estado SW:', e.target.state);
        });
      } else if (registration.waiting) {
        if (isDev) console.log('⏳ SW em espera...');
      } else if (registration.active) {
        if (isDev) console.log('🎯 SW ATIVO!');
      }
      
      return registration;
    } catch (error) {
      console.error('❌ Falha SW:', error);
      return null;
    }
  }, []);

  // ============================================================================
  // 3. CARREGAR LOJAS (ORIGINAL + RLS-AWARE)
  // ============================================================================
  const loadUserLojas = useCallback(async (userId) => {
    if (isDev) console.log('🏪 Carregando lojas:', userId);
    
    try {
      const { data: lojas, error } = await supabase
        .from('loja_associada')
        .select('id_loja, funcao')
        .eq('uid_usuario', userId)
        .eq('status_vinculacao', 'ativo'); // RLS anon_key filtra por user.

      if (error) throw error;

      if (isDev) console.log('✅ Lojas:', lojas?.length || 0);
      setUserLojas(lojas || []);
    } catch (error) {
      console.error('❌ Erro lojas:', error);
      setUserLojas([]);
    }
  }, []);

  // ============================================================================
  // 4. INITIALIZAÇÃO APP (ORIGINAL + SW)
  // ============================================================================
  useEffect(() => {
    if (isDev) console.log('🚀 Inicializando app...');
    
    const initializeApp = async () => {
      try {
        await registerServiceWorker(); // FCM SW para sino.
        await checkInitialSession();
      } catch (error) {
        console.error('💥 Erro init:', error);
      }
    };

    const checkInitialSession = async () => {
      try {
        if (isDev) console.log('🔐 Verificando sessão...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          if (isDev) console.log('✅ Sessão:', session.user.email);
          setUser(session.user);
          await loadUserLojas(session.user.id);
        } else {
          if (isDev) console.log('ℹ️ Sem sessão');
          setUser(null);
          setUserLojas([]);
        }
      } catch (error) {
        console.error('❌ Erro sessão:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [loadUserLojas]); // Dep: callback.

  // ============================================================================
  // 5. OUVIR AUTENTICAÇÃO (ORIGINAL + CLEANUP SW)
  // ============================================================================
  useEffect(() => {
    if (isDev) console.log('👂 Listener auth...');
    
    let swRegistration = null; // Para cleanup.
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isDev) console.log(`🔄 Auth event: ${event}`);
        
        if (event === 'SIGNED_IN' && session?.user) {
          if (isDev) console.log('🎯 Login:', session.user.email);
          setUser(session.user);
          await loadUserLojas(session.user.id);
          // Re-register SW pós-login.
          swRegistration = await registerServiceWorker();
        } else if (event === 'SIGNED_OUT') {
          if (isDev) console.log('🚪 Logout');
          setUser(null);
          setUserLojas([]);
          // Cleanup SW em logout.
          if (swRegistration) {
            await swRegistration.unregister();
            if (isDev) console.log('🧹 SW unregistered em logout');
          }
        } else if (event === 'USER_UPDATED' && session?.user) {
          if (isDev) console.log('📝 Updated:', session.user.email);
          setUser(session.user);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      if (isDev) console.log('🧹 Cleanup auth listener');
      subscription?.unsubscribe();
      if (swRegistration) swRegistration.unregister();
    };
  }, [loadUserLojas]); // Dep: callback.

  // ============================================================================
  // 6. RENDER (ORIGINAL + PROPS GLOBAIS)
  // ============================================================================
  // Passa para Layout: user (memo), loading, lojas.
  return (
    <Layout 
      initialUser={memoUser}
      isLoading={isLoading}
      userLojas={userLojas}
    >
      {/* Passa lojas para páginas (ex.: role filters). */}
      <Component {...pageProps} userLojas={userLojas} />
    </Layout>
  );
}

export default MyApp;