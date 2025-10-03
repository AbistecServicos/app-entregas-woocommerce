// src/hooks/useUserProfile.js
// CORREÇÃO DE EMERGÊNCIA - REMOVER LOOP INFINITO

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export const useUserProfile = () => {
  // ============================================================================
  // 1. ESTADOS E REFS (SIMPLIFICADOS PARA QUEBRAR O LOOP)
  // ============================================================================
  const [state, setState] = useState({
    user: null,
    userProfile: null,
    userRole: 'visitante',
    userLojas: [],
    loading: true,
    error: null,
    updating: false
  });

  const isMountedRef = useRef(true);
  const isLoadingRef = useRef(false);

  // ============================================================================
  // 2. LOAD USER DATA (CORREÇÃO CRÍTICA - REMOVER DEPENDÊNCIA CIRCULAR)
  // ============================================================================
  const loadUserData = useCallback(async () => {
    if (isLoadingRef.current) {
      return; // ✅ Já está carregando, evitar duplicata
    }

    try {
      isLoadingRef.current = true;
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (!isMountedRef.current) return;

      if (authError || !authUser) {
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

      // Buscar perfil do usuário
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('uid', authUser.id)
        .single();

      if (usuarioError) {
        setState(prev => ({
          ...prev,
          user: authUser,
          userProfile: null,
          userRole: 'visitante',
          userLojas: [],
          loading: false,
          error: 'Perfil não encontrado'
        }));
        return;
      }

      // Verificar se é admin
      if (usuarioData.is_admin === true) {
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

      // Buscar lojas associadas
      const { data: lojasData, error: lojasError } = await supabase
        .from('loja_associada')
        .select('*')
        .eq('uid_usuario', authUser.id)
        .eq('status_vinculacao', 'ativo');

      let finalUserRole = 'visitante';
      
      if (lojasData && lojasData.length > 0) {
        const funcoes = lojasData.map(loja => loja.funcao);
        if (funcoes.includes('gerente')) {
          finalUserRole = 'gerente';
        } else if (funcoes.includes('entregador')) {
          finalUserRole = 'entregador';
        }
      }

      // ✅ ATUALIZAÇÃO ÚNICA - SEM RE-RENDERS DESNECESSÁRIOS
      setState({
        user: authUser,
        userProfile: usuarioData,
        userRole: finalUserRole,
        userLojas: lojasData || [],
        loading: false,
        error: null,
        updating: false
      });

    } catch (error) {
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          user: null,
          userProfile: null,
          userRole: 'visitante',
          userLojas: [],
          loading: false,
          error: 'Erro ao carregar perfil'
        }));
      }
    } finally {
      isLoadingRef.current = false;
    }
  }, []); // ✅ CORREÇÃO CRÍTICA: array de dependências VAZIO

  // ============================================================================
  // 3. EFFECT DE INICIALIZAÇÃO (SIMPLIFICADO)
  // ============================================================================
  useEffect(() => {
    isMountedRef.current = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMountedRef.current) return;

        if (session?.user) {
          await loadUserData();
        } else {
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        if (isMountedRef.current) {
          setState(prev => ({ ...prev, loading: false }));
        }
      }
    };

    initializeAuth();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadUserData]);

  // ============================================================================
  // 4. EFFECT DO LISTENER (SIMPLIFICADO)
  // ============================================================================
  useEffect(() => {
    if (!isMountedRef.current) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMountedRef.current) return;

        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            if (session?.user) {
              // ✅ PEQUENO DELAY PARA EVITAR MÚLTIPLAS EXECUÇÕES
              setTimeout(() => loadUserData(), 100);
            }
            break;
          
          case 'SIGNED_OUT':
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
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  // ============================================================================
  // 5. REMOVER EFFECT DE DEBUG TEMPORARIAMENTE
  // ============================================================================
  // ❌ COMENTAR ESTE EFFECT PARA QUEBRAR O LOOP
  /*
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('👤 useUserProfile - Estado:', {
        user: state.user?.email,
        role: state.userRole,
        loading: state.loading
      });
    }
  }, [state.user?.email, state.userRole, state.loading]);
  */

  // ============================================================================
  // 6. FUNÇÕES AUXILIARES
  // ============================================================================
  const updateUserProfile = async (formData) => {
    // ... (manter igual ao anterior)
  };

  const reloadUserData = async () => {
    await loadUserData();
  };

  // ============================================================================
  // 7. RETORNO
  // ============================================================================
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