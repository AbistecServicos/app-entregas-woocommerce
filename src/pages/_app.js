// src/pages/_app.js
import { useState, useEffect } from 'react';
import '../styles/globals.css';
import Layout from '../components/Layout';
import { supabase } from '../../lib/supabase';

// ==============================================================================
// COMPONENTE PRINCIPAL DO NEXT.JS
// ==============================================================================
function MyApp({ Component, pageProps }) {
  // ============================================================================
  // 1. ESTADOS GLOBAIS
  // ============================================================================
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLojas, setUserLojas] = useState([]);

  // ============================================================================
  // 2. FUNÇÃO: REGISTRAR SERVICE WORKER (NOVA FUNÇÃO)
  // ============================================================================
  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });
        
        console.log('✅ Service Worker registrado com sucesso:', registration);
        
        // Monitorar estados do Service Worker
        if (registration.installing) {
          console.log('🔄 Service Worker instalando...');
          registration.installing.addEventListener('statechange', (e) => {
            console.log('📊 Estado do SW:', e.target.state);
          });
        } else if (registration.waiting) {
          console.log('⏳ Service Worker em espera...');
        } else if (registration.active) {
          console.log('🎯 Service Worker ATIVO e funcionando!');
        }
        
        return registration;
      } catch (error) {
        console.error('❌ Falha ao registrar Service Worker:', error);
        return null;
      }
    } else {
      console.log('ℹ️ Navegador não suporta Service Worker');
      return null;
    }
  };

  // ============================================================================
  // 3. FUNÇÃO: CARREGAR LOJAS DO USUÁRIO
  // ============================================================================
  const loadUserLojas = async (userId) => {
    try {
      console.log('🏪 Carregando lojas do usuário:', userId);
      
      const { data: lojas, error } = await supabase
        .from('loja_associada')
        .select('id_loja, funcao')
        .eq('uid_usuario', userId)
        .eq('status_vinculacao', 'ativo');

      if (error) throw error;

      console.log('✅ Lojas carregadas:', lojas?.length || 0);
      setUserLojas(lojas || []);
      
    } catch (error) {
      console.error('❌ Erro ao carregar lojas:', error);
      setUserLojas([]);
    }
  };

  // ============================================================================
  // 4. EFFECT: INICIALIZAÇÃO DO APP (NOVO EFFECT)
  // ============================================================================
  useEffect(() => {
    console.log('🚀 Inicializando aplicação...');
    
    const initializeApp = async () => {
      try {
        // ✅ Registrar Service Worker para notificações
        await registerServiceWorker();
        
        // ✅ Verificar autenticação do usuário
        await checkInitialSession();
        
      } catch (error) {
        console.error('💥 Erro na inicialização do app:', error);
      }
    };

    const checkInitialSession = async () => {
      try {
        console.log('🔐 Verificando sessão inicial...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('✅ Sessão encontrada:', session.user.email);
          setUser(session.user);
          await loadUserLojas(session.user.id);
        } else {
          console.log('ℹ️ Nenhuma sessão ativa');
          setUser(null);
          setUserLojas([]);
        }
      } catch (error) {
        console.error('❌ Erro ao verificar sessão:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // ============================================================================
  // 5. EFFECT: OUVIR MUDANÇAS DE AUTENTICAÇÃO
  // ============================================================================
  useEffect(() => {
    console.log('👂 Iniciando listener de autenticação...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔄 Evento de auth: ${event}`);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🎯 Usuário fez login:', session.user.email);
          setUser(session.user);
          await loadUserLojas(session.user.id);
        } 
        else if (event === 'SIGNED_OUT') {
          console.log('🚪 Usuário fez logout');
          setUser(null);
          setUserLojas([]);
        }
        else if (event === 'USER_UPDATED' && session?.user) {
          console.log('📝 Usuário atualizado:', session.user.email);
          setUser(session.user);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      console.log('🧹 Limpando listener de auth');
      subscription?.unsubscribe();
    };
  }, []);

  // ============================================================================
  // 6. RENDERIZAÇÃO PRINCIPAL
  // ============================================================================
  return (
    <Layout 
      initialUser={user}
      isLoading={isLoading}
      userLojas={userLojas}
    >
      {/* ✅ PASSA LOJAS PARA TODAS AS PÁGINAS */}
      <Component {...pageProps} userLojas={userLojas} />
    </Layout>
  );
}

export default MyApp;