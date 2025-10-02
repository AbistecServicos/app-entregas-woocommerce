// src/hooks/useUserProfile.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export const useUserProfile = () => {
  const [state, setState] = useState({
    user: null,
    userProfile: null,
    userRole: 'visitante',
    userLojas: [],
    loading: true,
    error: null,
    updating: false,
    isInitialized: false
  });

  // ============================================================================
  // FUNÇÃO PRINCIPAL: CARREGAR DADOS DO USUÁRIO (MANTIDA)
  // ============================================================================
  const loadUserData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // 1. VERIFICAR USUÁRIO AUTENTICADO
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Erro auth:', authError);
        setState(prev => ({
          ...prev,
          user: null,
          userProfile: null,
          userRole: 'visitante',
          userLojas: [],
          loading: false,
          error: 'Falha na autenticação: ' + authError.message
        }));
        return;
      }

      if (!authUser) {
        console.log('🔍 Nenhum usuário autenticado encontrado');
        setState(prev => ({
          ...prev,
          user: null,
          userProfile: null,
          userRole: 'visitante',
          userLojas: [],
          loading: false,
          error: null
        }));
        return;
      }

      console.log('👤 Usuário autenticado:', authUser.email);

      // 2. BUSCAR PERFIL NA TABELA 'usuarios'
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('uid', authUser.id)
        .single();

      if (usuarioError) {
        console.error('❌ Erro ao buscar perfil:', usuarioError);
        setState(prev => ({
          ...prev,
          user: authUser,
          userProfile: null,
          userRole: 'visitante',
          userLojas: [],
          loading: false,
          error: 'Perfil não encontrado: ' + usuarioError.message
        }));
        return;
      }

      // 3. VERIFICAÇÃO: É ADMINISTRADOR?
      if (usuarioData.is_admin === true) {
        console.log('⭐ Usuário é admin');
        setState(prev => ({
          ...prev,
          user: authUser,
          userProfile: usuarioData,
          userRole: 'admin',
          userLojas: [],
          loading: false,
          error: null
        }));
        return;
      }

      // 4. BUSCAR LOJAS ASSOCIADAS
      const { data: lojasData, error: lojasError } = await supabase
        .from('loja_associada')
        .select('*')
        .eq('uid_usuario', authUser.id)
        .eq('status_vinculacao', 'ativo');

      if (lojasError) {
        console.error('❌ Erro ao buscar lojas:', lojasError);
        setState(prev => ({
          ...prev,
          user: authUser,
          userProfile: usuarioData,
          userRole: 'visitante',
          userLojas: [],
          loading: false,
          error: null
        }));
        return;
      }

      // 5. DETERMINAR FUNÇÃO BASEADA NAS LOJAS ASSOCIADAS
      let finalUserRole = 'visitante';
      
      if (!lojasData || lojasData.length === 0) {
        finalUserRole = 'visitante';
      } else {
        const funcoes = lojasData.map(loja => loja.funcao);
        
        if (funcoes.includes('gerente')) {
          finalUserRole = 'gerente';
        } else if (funcoes.includes('entregador')) {
          finalUserRole = 'entregador';
        } else {
          finalUserRole = 'visitante';
        }
      }

      console.log(`🎯 Função definida: ${finalUserRole}`, lojasData);

      // ✅ ATUALIZAR ESTADO FINAL
      setState(prev => ({
        ...prev,
        user: authUser,
        userProfile: usuarioData,
        userRole: finalUserRole,
        userLojas: lojasData || [],
        loading: false,
        error: null
      }));

    } catch (error) {
      console.error('💥 Erro geral no loadUserData:', error);
      setState(prev => ({
        ...prev,
        user: null,
        userProfile: null,
        userRole: 'visitante',
        userLojas: [],
        loading: false,
        error: 'Erro inesperado: ' + error.message
      }));
    }
  };

  // ============================================================================
  // EFFECT PRINCIPAL: ESCUTAR MUDANÇAS DE AUTENTICAÇÃO (CORRIGIDO)
  // ============================================================================
  useEffect(() => {
    let isMounted = true;

    console.log('🔧 useUserProfile: Iniciando listener de auth...');

    // 1. INICIALIZAÇÃO IMEDIATA
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        console.log('🔄 Sessão inicial:', session?.user?.email);

        if (session?.user) {
          await loadUserData();
        } else {
          setState(prev => ({
            ...prev,
            user: null,
            userProfile: null,
            userRole: 'visitante',
            userLojas: [],
            loading: false,
            isInitialized: true
          }));
        }
      } catch (error) {
        console.error('❌ Erro na inicialização:', error);
      } finally {
        if (isMounted) {
          setState(prev => ({ ...prev, isInitialized: true }));
        }
      }
    };

    initializeAuth();

    // 🔥 CORREÇÃO CRÍTICA: ADICIONAR LISTENER PARA MUDANÇAS DE AUTH
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log('🔄 Auth State Change:', event, session?.user?.email);

        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
          case 'USER_UPDATED':
            console.log('✅ Usuário autenticado/atualizado, carregando dados...');
            await loadUserData();
            break;
          
          case 'SIGNED_OUT':
            console.log('🚪 Usuário deslogado');
            setState(prev => ({
              ...prev,
              user: null,
              userProfile: null,
              userRole: 'visitante',
              userLojas: [],
              loading: false,
              error: null
            }));
            break;
          
          default:
            console.log('🔍 Evento auth não tratado:', event);
        }
      }
    );

    return () => {
      console.log('🧹 useUserProfile: Limpando listener...');
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // ============================================================================
  // RESTANTE DO CÓDIGO (MANTIDO)
  // ============================================================================
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const hasUserChanged = state.user?.email !== sessionStorage.getItem('last_user_email');
      const hasRoleChanged = state.userRole !== sessionStorage.getItem('last_user_role');
      
      if (hasUserChanged || hasRoleChanged) {
        console.log('👤 useUserProfile - Estado:', {
          user: state.user?.email,
          role: state.userRole,
          loading: state.loading
        });
        
        sessionStorage.setItem('last_user_email', state.user?.email || '');
        sessionStorage.setItem('last_user_role', state.userRole);
      }
    }
  }, [state.user?.email, state.userRole, state.loading]);

  const updateUserProfile = async (formData) => {
    // ... (mantido igual)
  };

  const reloadUserData = async () => {
    await loadUserData();
  };

  return {
    user: state.user,
    userProfile: state.userProfile,
    userRole: state.userRole,
    userLojas: state.userLojas,
    loading: state.loading,
    error: state.error,
    updating: state.updating,
    updateUserProfile,
    reloadUserData
  };
};