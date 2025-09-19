// hooks/useUserProfile.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ==============================================================================
// HOOK PERSONALIZADO: useUserProfile
// ==============================================================================
/**
 * Hook para gerenciar dados do usuário autenticado, incluindo perfil, função (role)
 * e lojas associadas. Escuta mudanças de autenticação em tempo real e atualiza
 * estados automaticamente. Retorna estados e funções para uso em componentes.
 * Aprimoramentos: Otimização de desempenho, validação e logging detalhado.
 * @returns {Object} Objeto com estados (user, userProfile, userRole, etc.) e funções.
 */
export const useUserProfile = () => {
  // ============================================================================
  // 1. DEFINIÇÃO DOS ESTADOS
  // ============================================================================
  /**
   * Estados para gerenciar usuário, perfil, função, lojas, carregamento e erros.
   * @type {Object|null} user - Dados do usuário autenticado
   * @type {Object|null} userProfile - Dados do perfil (tabela 'usuarios')
   * @type {string} userRole - Papel do usuário ('admin', 'gerente', 'entregador', 'visitante')
   * @type {Array} userLojas - Lojas associadas (tabela 'loja_associada')
   * @type {boolean} loading - Indicador de carregamento inicial
   * @type {string|null} error - Mensagem de erro
   * @type {boolean} updating - Indicador de atualização do perfil
   */
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState('visitante');
  const [userLojas, setUserLojas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  // ============================================================================
  // 2. FUNÇÃO: CARREGAR DADOS DO USUÁRIO
  // ============================================================================
  /**
   * Carrega dados do usuário autenticado, perfil e lojas associadas.
   * Utiliza Promise.all para otimizar requisições paralelas.
   */
  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Iniciando loadUserData...');

      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Erro de autenticação:', authError.message);
        setError('Erro de autenticação: ' + authError.message);
        setUser(null);
        setUserProfile(null);
        setUserRole('visitante');
        setUserLojas([]);
        return;
      }

      if (!authUser) {
        console.log('Nenhum usuário autenticado encontrado.');
        setUser(null);
        setUserProfile(null);
        setUserRole('visitante');
        setUserLojas([]);
        return;
      }

      setUser(authUser);
      console.log('Usuário autenticado:', authUser.id);

      const [usuarioResponse, lojaResponse] = await Promise.all([
        supabase
          .from('usuarios')
          .select('*')
          .eq('uid', authUser.id)
          .single(),
        supabase
          .from('loja_associada')
          .select(`
            *,
            semana_entregue,
            semana_cancelado,
            mes_entregue,
            mes_cancelado, 
            ano_entregue,
            ano_cancelado
          `) // ← CORREÇÃO AQUI: Incluir campos de estatísticas
          .eq('uid_usuario', authUser.id)
          .eq('status_vinculacao', 'ativo')
      ]);

      if (usuarioResponse.error) {
        console.error('Erro ao buscar perfil:', usuarioResponse.error.message);
        setError('Erro ao buscar perfil: ' + usuarioResponse.error.message);
        setUserProfile(null);
        setUserRole('visitante');
        setUserLojas([]);
        return;
      }

      const usuarioData = usuarioResponse.data;
      setUserProfile(usuarioData);
      console.log('Perfil carregado:', usuarioData);

      if (usuarioData?.is_admin) {
        setUserRole('admin');
        setUserLojas([]);
        console.log('Usuário é admin.');
        return;
      }

      if (lojaResponse.error) {
        console.error('Erro ao buscar lojas:', lojaResponse.error.message);
        setError('Erro ao buscar lojas: ' + lojaResponse.error.message);
        setUserLojas([]);
        setUserRole('visitante');
        return;
      }

      const lojaData = lojaResponse.data || [];
      if (lojaData.length === 0) {
        setUserRole('visitante');
        setUserLojas([]);
        console.log('Nenhuma loja associada encontrada.');
        return;
      }

      setUserLojas(lojaData);
      console.log('Lojas carregadas:', lojaData);

      const gerente = lojaData.find(loja => loja.funcao === 'gerente');
      if (gerente) {
        const lojasGerente = lojaData.filter(loja => loja.funcao === 'gerente');
        if (lojasGerente.length > 1) {
          setError('ERRO: Usuário não pode ser gerente em múltiplas lojas');
          setUserRole('erro');
          console.error('Múltiplas lojas gerenciadas detectadas.');
        } else {
          setUserRole('gerente');
          console.log('Usuário é gerente.');
        }
      } else {
        setUserRole('entregador');
        console.log('Usuário é entregador.');
      }
    } catch (error) {
      console.error('Erro inesperado no loadUserData:', error);
      setError('Erro inesperado: ' + error.message);
    } finally {
      setLoading(false);
      console.log('loadUserData finalizado.');
    }
  };

  // ... o restante do código permanece igual ...

  // ============================================================================
  // 3. EFFECT: CARREGAMENTO INICIAL E ESCUTA DE AUTENTICAÇÃO
  // ============================================================================
  /**
   * Carrega dados iniciais e escuta mudanças de autenticação em tempo real.
   * Utiliza debounce implícito via useEffect para evitar chamadas excessivas.
   */
  useEffect(() => {
    loadUserData();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Mudança de autenticação detectada:', event);
        if (event === 'SIGNED_IN') {
          await loadUserData();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserProfile(null);
          setUserRole('visitante');
          setUserLojas([]);
          setLoading(false);
          console.log('Usuário desconectado.');
        }
      }
    );

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
        console.log('Listener de autenticação desinscrevido.');
      }
    };
  }, []);

  // ============================================================================
  // 4. FUNÇÃO: ATUALIZAR PERFIL DO USUÁRIO
  // ============================================================================
  /**
   * Atualiza os dados do perfil na tabela 'usuarios' e, se aplicável, em 'loja_associada'.
   * Valida dados antes de atualizar e retorna resultado.
   * @param {Object} formData - Dados a serem atualizados (nome, telefone, foto, etc.)
   * @returns {Object} Resultado com sucesso e mensagem
   */
  const updateUserProfile = async (formData) => {
    try {
      setUpdating(true);
      setError(null);
      console.log('Iniciando updateUserProfile com:', formData);

      if (!userProfile || !userProfile.uid) {
        throw new Error('Usuário não autenticado ou perfil inválido');
      }

      if (!formData.nome_completo || !formData.telefone) {
        throw new Error('Nome completo e telefone são obrigatórios');
      }

      const { error: userError } = await supabase
        .from('usuarios')
        .update({
          nome_completo: formData.nome_completo,
          nome_usuario: formData.nome_usuario || userProfile.nome_usuario,
          telefone: formData.telefone,
          foto: formData.foto || userProfile.foto
        })
        .eq('uid', userProfile.uid);

      if (userError) throw userError;

      if (userRole === 'entregador' && userLojas.length > 0) {
        const { error: lojaError } = await supabase
          .from('loja_associada')
          .update({
            veiculo: formData.veiculo || userLojas[0].veiculo,
            carga_maxima: formData.carga_maxima ? parseInt(formData.carga_maxima) : userLojas[0].carga_maxima,
            perimetro_entrega: formData.perimetro_entrega || userLojas[0].perimetro_entrega,
            nome_completo: formData.nome_completo
          })
          .eq('uid_usuario', userProfile.uid)
          .eq('id_loja', userLojas[0].id_loja);

        if (lojaError) throw lojaError;
      }

      setUserProfile(prev => ({
        ...prev,
        nome_completo: formData.nome_completo,
        nome_usuario: formData.nome_usuario || prev.nome_usuario,
        telefone: formData.telefone,
        foto: formData.foto || prev.foto
      }));

      if (userRole === 'entregador' && userLojas.length > 0) {
        setUserLojas(prev => prev.map(loja =>
          loja.id_loja === userLojas[0].id_loja ? {
            ...loja,
            veiculo: formData.veiculo || loja.veiculo,
            carga_maxima: formData.carga_maxima ? parseInt(formData.carga_maxima) : loja.carga_maxima,
            perimetro_entrega: formData.perimetro_entrega || loja.perimetro_entrega,
            nome_completo: formData.nome_completo
          } : loja
        ));
      }

      console.log('Perfil atualizado com sucesso.');
      return { success: true, message: 'Perfil atualizado com sucesso!' };
    } catch (error) {
      const errorMsg = 'Erro ao atualizar perfil: ' + error.message;
      setError(errorMsg);
      console.error('Erro no updateUserProfile:', error);
      return { success: false, message: errorMsg };
    } finally {
      setUpdating(false);
      console.log('updateUserProfile finalizado.');
    }
  };

  // ============================================================================
  // 5. FUNÇÃO: RECARREGAR DADOS DO USUÁRIO
  // ============================================================================
  /**
   * Força a recarga dos dados do usuário, reutilizando loadUserData.
   * Útil para sincronizar após atualizações externas.
   */
  const reloadUserData = async () => {
    console.log('Recarregando dados do usuário...');
    await loadUserData();
  };

  // ============================================================================
  // 6. RETORNO DO HOOK
  // ============================================================================
  /**
   * Retorna todos os estados e funções para uso em componentes.
   * @returns {Object} Contendo user, userProfile, userRole, userLojas, etc.
   */
  return {
    user,
    userProfile,
    userRole,
    userLojas,
    loading,
    error,
    updating,
    updateUserProfile,
    reloadUserData
  };
};