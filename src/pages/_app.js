// ========================================
// _APP.JS - ROOT NEXT.JS OTIMIZADO (CORRIGIDO)
// ========================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head'; // ✅ IMPORT ADICIONADO
import '../styles/globals.css';
import Layout from '../components/Layout';
import { supabase } from '../../lib/supabase';

const isDev = process.env.NODE_ENV === 'development';

function MyApp({ Component, pageProps }) {
  // ============================================================================
  // 1. ESTADOS GLOBAIS
  // ============================================================================
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLojas, setUserLojas] = useState([]);

  const memoUser = useMemo(() => user, [user]);

  // ============================================================================
  // 2. REGISTRAR SERVICE WORKER
  // ============================================================================
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      if (isDev) console.log('ℹ️ Navegador não suporta Service Worker');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
      if (isDev) console.log('✅ Service Worker registrado:', registration);
      return registration;
    } catch (error) {
      console.error('❌ Falha SW:', error);
      return null;
    }
  }, []);

  // ============================================================================
  // 3. CARREGAR LOJAS
  // ============================================================================
  const loadUserLojas = useCallback(async (userId) => {
    try {
      const { data: lojas, error } = await supabase
        .from('loja_associada')
        .select('id_loja, funcao')
        .eq('uid_usuario', userId)
        .eq('status_vinculacao', 'ativo');

      if (error) throw error;
      setUserLojas(lojas || []);
    } catch (error) {
      console.error('❌ Erro lojas:', error);
      setUserLojas([]);
    }
  }, []);

  // ============================================================================
  // 4. INITIALIZAÇÃO APP
  // ============================================================================
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await registerServiceWorker();
        await checkInitialSession();
      } catch (error) {
        console.error('💥 Erro init:', error);
      }
    };

    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          await loadUserLojas(session.user.id);
        } else {
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
  }, [loadUserLojas, registerServiceWorker]);

  // ============================================================================
  // 5. OUVIR AUTENTICAÇÃO
  // ============================================================================
  useEffect(() => {
    let swRegistration = null;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          await loadUserLojas(session.user.id);
          swRegistration = await registerServiceWorker();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserLojas([]);
          if (swRegistration) await swRegistration.unregister();
        } else if (event === 'USER_UPDATED' && session?.user) {
          setUser(session.user);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [loadUserLojas, registerServiceWorker]);

  // ============================================================================
  // 6. RENDER (COM VIEWPORT CORRIGIDO)
  // ============================================================================
  return (
    <>
      {/* ✅ HEAD COM VIEWPORT - ESSENCIAL PARA MOBILE */}
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <Layout 
        initialUser={memoUser}
        isLoading={isLoading}
        userLojas={userLojas}
      >
        <Component {...pageProps} userLojas={userLojas} />
      </Layout>
    </>
  );
}

export default MyApp;