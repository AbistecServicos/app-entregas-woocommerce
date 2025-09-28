// src/pages/_app.js
import { useState, useEffect } from 'react';
import '../styles/globals.css';
import Layout from '../components/Layout';
import { supabase } from '../../lib/supabase';

function MyApp({ Component, pageProps }) {
  const [isLoading, setIsLoading] = useState(true);
  const [initialUser, setInitialUser] = useState(null);
  const [userLojas, setUserLojas] = useState([]);

  // ============================================================================
  // 1. VERIFICAÇÃO INICIAL DE AUTENTICAÇÃO
  // ============================================================================
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        console.log('🔐 Iniciando verificação de autenticação...');
        
        const { data: { session } } = await supabase.auth.getSession();
        console.log('👤 Sessão encontrada:', !!session);
        setInitialUser(session?.user || null);
        
        // Se tem usuário, carrega suas lojas
        if (session?.user) {
          await loadUserLojas(session.user.id);
        }
      } catch (error) {
        console.error('❌ Erro ao verificar autenticação:', error);
        setInitialUser(null);
        setUserLojas([]);
      } finally {
        setIsLoading(false);
        console.log('✅ Verificação de autenticação concluída');
      }
    };

    checkAuthState();

    // Escuta mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Mudança de autenticação:', event);
        
        const currentUser = session?.user || null;
        setInitialUser(currentUser);
        
        if (event === 'SIGNED_IN' && currentUser) {
          await loadUserLojas(currentUser.id);
        }
        
        if (event === 'SIGNED_OUT') {
          setUserLojas([]);
          console.log('🧹 Lojas limpas (logout)');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ============================================================================
  // 2. CARREGAMENTO DAS LOJAS DO USUÁRIO (CORRIGIDO)
  // ============================================================================
  const loadUserLojas = async (userId) => {
  try {
    console.log('🏪 Carregando lojas do usuário:', userId);
    
    const { data: lojas, error } = await supabase
      .from('loja_associada')
      .select('id_loja')
      .eq('uid_usuario', userId)
      .eq('status_vinculacao', 'ativo');

    if (error) throw error;

    if (lojas && lojas.length > 0) {
      const lojasIds = lojas.map(loja => loja.id_loja);
      setUserLojas(lojasIds); // ← ESTÁ FUNCIONANDO?
      console.log(`✅ ${lojas.length} loja(s) carregada(s):`, lojasIds);
    } else {
      setUserLojas([]);
      console.log('ℹ️ Usuário não tem lojas associadas');
    }
  } catch (error) {
    console.error('❌ Erro ao carregar lojas:', error);
    setUserLojas([]);
  }
};

  // ============================================================================
  // 3. SERVICE WORKER
  // ============================================================================
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      console.log('🔧 Registrando Service Worker...');
      
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registrado com sucesso');
        })
        .catch((error) => {
          console.error('❌ Erro no Service Worker:', error);
        });
    }
  }, []);

  // ============================================================================
  // 4. RENDERIZAÇÃO PRINCIPAL
  // ============================================================================
  return (
    <Layout 
      initialUser={initialUser} 
      isLoading={isLoading}
      userLojas={userLojas}
    >
      {/* ✅ PASSA LOJAS PARA TODAS AS PÁGINAS */}
      <Component {...pageProps} userLojas={userLojas} />
    </Layout>
  );
}

export default MyApp;