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
      console.log('🔄 Iniciando carregamento de dados do usuário...');

      // 3.1. VERIFICAR USUÁRIO AUTENTICADO
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Erro de autenticação:', authError);
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
        console.log('👤 Nenhum usuário autenticado');
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

      console.log('✅ Usuário autenticado:', authUser.email);

      // 3.2. BUSCAR PERFIL NA TABELA 'usuarios'
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

      console.log('✅ Perfil carregado:', usuarioData.nome_completo);

      // 3.3. VERIFICAÇÃO: É ADMINISTRADOR?
      if (usuarioData.is_admin === true) {
        console.log('🎯 Usuário é ADMINISTRADOR (is_admin = true)');
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
        console.warn('⚠️ Erro ao buscar lojas associadas:', lojasError);
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

      console.log('📊 Lojas associadas encontradas:', lojasData?.length || 0);

      // 3.5. DETERMINAR FUNÇÃO BASEADA NAS LOJAS ASSOCIADAS (CORRIGIDO)
      let finalUserRole = 'visitante';
      
      if (!lojasData || lojasData.length === 0) {
        console.log('👤 Usuário é VISITANTE (sem lojas associadas)');
        finalUserRole = 'visitante';
      } else {
        const lojasComoGerente = lojasData.filter(loja => loja.funcao === 'gerente');
        const lojasComoEntregador = lojasData.filter(loja => loja.funcao === 'entregador');
        
        if (lojasComoGerente.length > 0) {
          if (lojasComoGerente.length > 1) {
            console.error('❌ CONFLITO: Usuário é gerente em múltiplas lojas');
            finalUserRole = 'erro';
          } else {
            console.log('💼 Usuário é GERENTE da loja:', lojasComoGerente[0].id_loja);
            finalUserRole = 'gerente';
          }
        } else if (lojasComoEntregador.length > 0) {
          console.log('🚚 Usuário é ENTREGADOR em', lojasComoEntregador.length, 'loja(s)');
          finalUserRole = 'entregador';
        } else {
          console.log('🔍 Usuário tem lojas mas sem função definida');
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

      console.log('✅ Carregamento finalizado. Função:', finalUserRole);

    } catch (error) {
      console.error('💥 Erro inesperado no carregamento:', error);
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
        console.log('🔐 Iniciando verificação de autenticação...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (error) {
          console.error('❌ Erro ao verificar sessão:', error);
          return;
        }

        if (session?.user) {
          console.log('✅ Usuário logado:', session.user.email);
          await loadUserData();
        } else {
          console.log('👤 Nenhum usuário autenticado');
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
        console.error('💥 Erro inesperado:', error);
      } finally {
        if (isMounted) {
          setState(prev => ({ ...prev, isInitialized: true }));
          console.log('✅ Inicialização concluída');
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      console.log('🧹 Cleanup do effect de autenticação');
    };
  }, []);

  // ============================================================================
  // 5. EFFECT: DEBUG - MONITORAR MUDANÇAS DE ESTADO (OPCIONAL)
  // ============================================================================
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 DEBUG - Estado atualizado:', {
        user: state.user?.email,
        userRole: state.userRole,
        loading: state.loading,
        isInitialized: state.isInitialized
      });
    }
  }, [state.user, state.userRole, state.loading, state.isInitialized]);

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
    console.log('🔄 Recarregando dados do usuário...');
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