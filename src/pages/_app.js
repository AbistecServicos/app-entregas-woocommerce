// src/pages/_app.js
import { useState, useEffect } from 'react';
import '../styles/globals.css';
import Layout from '../components/Layout';
import { supabase } from '../../lib/supabase';

function MyApp({ Component, pageProps }) {
  const [isLoading, setIsLoading] = useState(true);
  const [initialUser, setInitialUser] = useState(null);

  // ============================================================================
  // 1. VERIFICAÇÃO INICIAL DE AUTENTICAÇÃO (NÃO-BLOQUEANTE)
  // ============================================================================
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Verifica se há uma sessão ativa sem bloquear a UI
        const { data: { session } } = await supabase.auth.getSession();
        setInitialUser(session?.user || null);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setInitialUser(null);
      } finally {
        setIsLoading(false); // ⚡ LIBERA A UI RAPIDAMENTE
      }
    };

    checkAuthState();

    // Escuta mudanças de autenticação em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setInitialUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ============================================================================
  // 2. SERVICE WORKER (MANTIDO - NÃO INTERFERE NO CARREGAMENTO)
  // ============================================================================
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registrado:', registration);
        })
        .catch((error) => {
          console.error('❌ Erro no Service Worker:', error);
        });
    }
  }, []);

  // ============================================================================
  // 3. RENDERIZAÇÃO PRINCIPAL (OTIMIZADA)
  // ============================================================================
  return (
    <Layout initialUser={initialUser} isLoading={isLoading}>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;