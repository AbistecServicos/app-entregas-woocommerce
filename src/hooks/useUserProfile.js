// src/hooks/useUserProfile.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

// ==============================================================================
// 1. HOOK PERSONALIZADO: useUserProfile (CORRIGIDO)
// ==============================================================================
export const useUserProfile = () => {
  // ============================================================================
  // 2. ESTADOS DO HOOK
  // ============================================================================
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
  // 3. FUNÇÃO PRINCIPAL: CARREGAR DADOS DO USUÁRIO (CORRIGIDA)
  // ============================================================================
  const loadUserData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // 3.1. VERIFICAR USUÁRIO AUTENTICADO
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
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

      // 3.2. BUSCAR PERFIL NA TABELA 'usuarios'
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
          error: 'Perfil não encontrado: ' + usuarioError.message
        }));
        return;
      }

      // 3.3. VERIFICAÇÃO: É ADMINISTRADOR?
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

      // 3.4. BUSCAR LOJAS ASSOCIADAS
      const { data: lojasData, error: lojasError } = await supabase
        .from('loja_associada')
        .select('*')
        .eq('uid_usuario', authUser.id)
        .eq('status_vinculacao', 'ativo');

      if (lojasError) {
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

      // 3.5. DETERMINAR FUNÇÃO BASEADA NAS LOJAS ASSOCIADAS (CORREÇÃO APLICADA)
      let finalUserRole = 'visitante';
      
      if (!lojasData || lojasData.length === 0) {
        finalUserRole = 'visitante';
      } else {
        // ✅ CORREÇÃO: Permitir múltiplas lojas como gerente
        const funcoes = lojasData.map(loja => loja.funcao);
        
        if (funcoes.includes('gerente')) {
          finalUserRole = 'gerente';
        } else if (funcoes.includes('entregador')) {
          finalUserRole = 'entregador';
        } else {
          finalUserRole = 'visitante';
        }
      }

      // ✅ CORREÇÃO: ATUALIZAR TODOS OS ESTADOS DE UMA VEZ
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
  // 4. EFFECT: INICIALIZAÇÃO (CORRIGIDA)
  // ============================================================================
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (error) {
          return;
        }

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
        // Silencioso em produção
      } finally {
        if (isMounted) {
          setState(prev => ({ ...prev, isInitialized: true }));
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // ============================================================================
  // 5. EFFECT: DEBUG - APENAS LOGS ÚTEIS (CORRIGIDO)
  // ============================================================================
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // ✅ LOG APENAS QUANDO MUDANÇAS IMPORTANTES ACONTECEM
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

  // ============================================================================
  // 6. FUNÇÃO: ATUALIZAR PERFIL DO USUÁRIO
  // ============================================================================
  const updateUserProfile = async (formData) => {
    try {
      setState(prev => ({ ...prev, updating: true, error: null }));

      if (!state.userProfile?.uid) throw new Error('Perfil não carregado');
      if (!formData.nome_completo || !formData.telefone) {
        throw new Error('Nome completo e telefone são obrigatórios');
      }

      const updateData = {
        nome_completo: formData.nome_completo,
        nome_usuario: formData.nome_usuario || state.userProfile.nome_usuario,
        telefone: formData.telefone,
        foto: formData.foto || state.userProfile.foto
      };

      const { error: updateError } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('uid', state.userProfile.uid);

      if (updateError) throw updateError;

      setState(prev => ({
        ...prev,
        userProfile: { ...prev.userProfile, ...updateData },
        updating: false
      }));

      return { success: true, message: 'Perfil atualizado com sucesso!' };

    } catch (error) {
      const errorMsg = 'Erro ao atualizar: ' + error.message;
      setState(prev => ({ ...prev, error: errorMsg, updating: false }));
      return { success: false, message: errorMsg };
    }
  };

  // ============================================================================
  // 7. FUNÇÃO: RECARREGAR DADOS
  // ============================================================================
  const reloadUserData = async () => {
    await loadUserData();
  };

  // ============================================================================
  // 8. RETORNO DO HOOK
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