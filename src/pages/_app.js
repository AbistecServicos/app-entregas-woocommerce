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
  // 2. FUNÇÃO: CARREGAR LOJAS DO USUÁRIO
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
  // 3. EFFECT: VERIFICAR AUTENTICAÇÃO AO INICIAR
  // ============================================================================
  useEffect(() => {
    console.log('🔐 Verificando sessão inicial...');
    
    const checkSession = async () => {
      try {
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

    checkSession();
  }, []);

  // ============================================================================
  // 4. EFFECT: OUVIR MUDANÇAS DE AUTENTICAÇÃO (CORRIGIDO)
  // ============================================================================
  useEffect(() => {
    console.log('👂 Iniciando listener de autenticação...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔄 Evento de auth: ${event}`);
        
        // ✅ BLOCO 4.1: LOGIN
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🎯 Usuário fez login:', session.user.email);
          setUser(session.user);
          await loadUserLojas(session.user.id);
        } 
        
        // ✅ BLOCO 4.2: LOGOUT
        else if (event === 'SIGNED_OUT') {
          console.log('🚪 Usuário fez logout');
          setUser(null);
          setUserLojas([]);
        }
        
        // ✅ BLOCO 4.3: OUTROS EVENTOS
        else if (event === 'USER_UPDATED' && session?.user) {
          console.log('📝 Usuário atualizado:', session.user.email);
          setUser(session.user);
        }
        
        setIsLoading(false);
      }
    );

    // ✅ BLOCO 4.4: CLEANUP
    return () => {
      console.log('🧹 Limpando listener de auth');
      subscription?.unsubscribe();
    };
  }, []);

  // ============================================================================
  // 5. RENDERIZAÇÃO PRINCIPAL
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
