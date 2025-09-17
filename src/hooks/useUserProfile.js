// hooks/useUserProfile.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ==============================================================================
// HOOK PERSONALIZADO: useUserProfile
// ==============================================================================
/**
 * Hook personalizado para gerenciar dados do usuário logado
 * Responsável por: autenticação, permissões, dados do perfil e edição
 */
export const useUserProfile = () => {
  // ============================================================================
  // 1. ESTADOS DO HOOK
  // ============================================================================
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [userLojas, setUserLojas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false); // ✅ NOVO: Estado para edição

  // ============================================================================
  // 2. EFFECT PRINCIPAL - CARREGAMENTO DOS DADOS
  // ============================================================================
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // ======================================================================
        // 2.1. VERIFICAÇÃO DE AUTENTICAÇÃO
        // ======================================================================
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          setError('Erro de autenticação: ' + authError.message);
          setLoading(false);
          return;
        }
        
        if (!authUser) {
          setUserRole('visitante');
          setLoading(false);
          return;
        }

        setUser(authUser);

        // ======================================================================
        // 2.2. VERIFICAÇÃO DE ADMINISTRADOR
        // ======================================================================
        const { data: usuarioData, error: userError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('uid', authUser.id)
          .single();

        if (userError) {
          setError('Erro ao buscar usuário: ' + userError.message);
          setLoading(false);
          return;
        }

        // Se for admin, define role e finaliza
        if (usuarioData?.is_admin) {
          setUserRole('admin');
          setUserProfile(usuarioData);
          setLoading(false);
          return;
        }

        // ======================================================================
        // 2.3. BUSCA DE LOJAS ASSOCIADAS (NÃO-ADMIN)
        // ======================================================================
        const { data: lojaData, error: lojaError } = await supabase
          .from('loja_associada')
          .select('*')
          .eq('uid_usuario', authUser.id)
          .eq('status_vinculacao', 'ativo');

        if (lojaError) {
          setError('Erro ao buscar lojas: ' + lojaError.message);
          setLoading(false);
          return;
        }

        // Se não tem lojas associadas, é visitante
        if (!lojaData || lojaData.length === 0) {
          setUserRole('visitante');
          setLoading(false);
          return;
        }

        // ======================================================================
        // 2.4. DEFINIÇÃO DA FUNÇÃO (ROLE) DO USUÁRIO
        // ======================================================================
        setUserLojas(lojaData);
        
        // Verifica se é GERENTE
        const gerente = lojaData.find(loja => loja.funcao === 'gerente');
        
        if (gerente) {
          if (lojaData.length > 1) {
            setError('ERRO: Gerente não pode ter múltiplas lojas');
            setUserRole('erro');
          } else {
            setUserRole('gerente');
          }
        } else {
          // Se não é gerente, é ENTREGADOR
          setUserRole('entregador');
        }

        setUserProfile(usuarioData);

      } catch (error) {
        // ======================================================================
        // 2.5. TRATAMENTO DE ERROS GERAIS
        // ======================================================================
        setError('Erro inesperado: ' + error.message);
        console.error('Erro no useUserProfile:', error);
      } finally {
        // ======================================================================
        // 2.6. FINALIZAÇÃO
        // ======================================================================
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // ============================================================================
  // 3. FUNÇÕES DE EDIÇÃO DE PERFIL
  // ============================================================================
  /**
   * Função para atualizar perfil do usuário
   * Atualiza tanto tabela 'usuarios' quanto 'loja_associada' quando necessário
   */
  const updateUserProfile = async (formData) => {
    try {
      setUpdating(true);
      setError(null);

      // ========================================================================
      // 3.1. VALIDAÇÃO INICIAL
      // ========================================================================
      if (!userProfile || !userProfile.uid) {
        throw new Error('Usuário não autenticado');
      }

      // ========================================================================
      // 3.2. ATUALIZAR TABELA USUARIOS (TODOS OS USUÁRIOS)
      // ========================================================================
      const { error: userError } = await supabase
        .from('usuarios')
        .update({
          nome_completo: formData.nome_completo,
          nome_usuario: formData.nome_usuario,
          telefone: formData.telefone,
          foto: formData.foto
        })
        .eq('uid', userProfile.uid);

      if (userError) throw userError;

      // ========================================================================
      // 3.3. ATUALIZAR TABELA LOJA_ASSOCIADA (APENAS ENTREGADORES)
      // ========================================================================
      if (userRole === 'entregador' && userLojas.length > 0) {
        const { error: lojaError } = await supabase
          .from('loja_associada')
          .update({
            veiculo: formData.veiculo,
            carga_maxima: formData.carga_maxima ? parseInt(formData.carga_maxima) : null,
            perimetro_entrega: formData.perimetro_entrega,
            nome_completo: formData.nome_completo // Mantém sincronizado
          })
          .eq('uid_usuario', userProfile.uid)
          .eq('id_loja', userLojas[0].id_loja);

        if (lojaError) throw lojaError;
      }

      // ========================================================================
      // 3.4. ATUALIZAR ESTADOS LOCAIS
      // ========================================================================
      setUserProfile(prev => ({
        ...prev,
        nome_completo: formData.nome_completo,
        nome_usuario: formData.nome_usuario,
        telefone: formData.telefone,
        foto: formData.foto
      }));

      if (userRole === 'entregador' && userLojas.length > 0) {
        setUserLojas(prev => prev.map(loja => 
          loja.id_loja === userLojas[0].id_loja ? {
            ...loja,
            veiculo: formData.veiculo,
            carga_maxima: formData.carga_maxima,
            perimetro_entrega: formData.perimetro_entrega,
            nome_completo: formData.nome_completo
          } : loja
        ));
      }

      return { success: true, message: 'Perfil atualizado com sucesso!' };

    } catch (error) {
      // ========================================================================
      // 3.5. TRATAMENTO DE ERROS NA EDIÇÃO
      // ========================================================================
      const errorMsg = 'Erro ao atualizar perfil: ' + error.message;
      setError(errorMsg);
      console.error('Erro no updateUserProfile:', error);
      return { success: false, message: errorMsg };
    } finally {
      // ========================================================================
      // 3.6. FINALIZAÇÃO DA EDIÇÃO
      // ========================================================================
      setUpdating(false);
    }
  };

  // ============================================================================
  // 4. FUNÇÃO: RECARREGAR DADOS DO USUÁRIO
  // ============================================================================
  /**
   * Função para recarregar todos os dados do usuário
   * Útil após edições ou mudanças externas
   */
  const reloadUserData = async () => {
    setLoading(true);
    try {
      // Recarregar dados de autenticação
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      if (authUser) {
        // Recarregar dados do usuário
        const { data: usuarioData } = await supabase
          .from('usuarios')
          .select('*')
          .eq('uid', authUser.id)
          .single();
        setUserProfile(usuarioData);

        // Recarregar lojas associadas (apenas não-admin)
        if (!usuarioData?.is_admin) {
          const { data: lojaData } = await supabase
            .from('loja_associada')
            .select('*')
            .eq('uid_usuario', authUser.id)
            .eq('status_vinculacao', 'ativo');
          setUserLojas(lojaData || []);
        }
      }
    } catch (error) {
      console.error('Erro ao recarregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // 5. RETORNO DO HOOK
  // ============================================================================
  return { 
    // Estados principais
    user,
    userProfile, 
    userRole, 
    userLojas, 
    loading, 
    error,
    updating, // ✅ NOVO: Estado de edição
    
    // Funções
    updateUserProfile, // ✅ NOVO: Função de edição
    reloadUserData // ✅ NOVO: Função de recarregamento
  };
};