// hooks/useUserProfile.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ==============================================================================
// HOOK PERSONALIZADO: useUserProfile
// ==============================================================================
/**
 * Hook para gerenciar dados do usuário autenticado com sistema de permissões baseado em:
 * 1. ✅ Tabela 'usuarios': Campo 'is_admin' (boolean) - Define administradores do sistema
 * 2. ✅ Tabela 'loja_associada': Campo 'funcao' (string) - Define gerentes e entregadores
 * 
 * Fluxo de decisão de permissões:
 * 1. Se is_admin = true → Administrador (acesso completo)
 * 2. Se tem registro em loja_associada com funcao = 'gerente' → Gerente (acesso à loja)
 * 3. Se tem registro em loja_associada com funcao = 'entregador' → Entregador (acesso limitado)
 * 4. Se não atende nenhum critério → Visitante (acesso mínimo)
 */
export const useUserProfile = () => {
  // ============================================================================
  // 1. ESTADOS DO HOOK
  // ============================================================================
  const [user, setUser] = useState(null); // Dados do Supabase Auth
  const [userProfile, setUserProfile] = useState(null); // Dados da tabela 'usuarios'
  const [userRole, setUserRole] = useState('visitante'); // Função: 'admin', 'gerente', 'entregador', 'visitante'
  const [userLojas, setUserLojas] = useState([]); // Lojas associadas da tabela 'loja_associada'
  const [loading, setLoading] = useState(true); // Estado de carregamento
  const [error, setError] = useState(null); // Mensagens de erro
  const [updating, setUpdating] = useState(false); // Estado de atualização

  // ============================================================================
  // 2. FUNÇÃO PRINCIPAL: CARREGAR DADOS DO USUÁRIO
  // ============================================================================
  /**
   * Carrega todos os dados do usuário de forma sequencial e determinística
   * Segue a hierarquia de permissões do sistema
   */
  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Iniciando carregamento de dados do usuário...');

      // 2.1. OBTER USUÁRIO AUTENTICADO
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Erro de autenticação:', authError);
        setError('Falha na autenticação: ' + authError.message);
        resetToVisitor();
        return;
      }

      if (!authUser) {
        console.log('👤 Nenhum usuário autenticado');
        resetToVisitor();
        return;
      }

      setUser(authUser);
      console.log('✅ Usuário autenticado:', authUser.email);

      // 2.2. BUSCAR PERFIL NA TABELA 'usuarios'
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('uid', authUser.id)
        .single();

      if (usuarioError) {
        console.error('❌ Erro ao buscar perfil:', usuarioError);
        setError('Perfil não encontrado: ' + usuarioError.message);
        resetToVisitor();
        return;
      }

      setUserProfile(usuarioData);
      console.log('✅ Perfil carregado:', usuarioData.nome_completo);

      // 2.3. ✅ VERIFICAÇÃO CRÍTICA: É ADMINISTRADOR?
      if (usuarioData.is_admin === true) {
        console.log('🎯 Usuário é ADMINISTRADOR (is_admin = true)');
        setUserRole('admin');
        setUserLojas([]); // Admin não precisa de lojas associadas
        setLoading(false);
        return; // Interrompe aqui - admin tem acesso total
      }

      // 2.4. BUSCAR LOJAS ASSOCIADAS NA TABELA 'loja_associada'
      const { data: lojasData, error: lojasError } = await supabase
        .from('loja_associada')
        .select('*')
        .eq('uid_usuario', authUser.id)
        .eq('status_vinculacao', 'ativo');

      if (lojasError) {
        console.warn('⚠️ Erro ao buscar lojas associadas:', lojasError);
        setUserLojas([]);
        setUserRole('visitante'); // Sem lojas = visitante
        setLoading(false);
        return;
      }

      setUserLojas(lojasData || []);
      console.log('📊 Lojas associadas encontradas:', lojasData?.length || 0);

      // 2.5. DETERMINAR FUNÇÃO BASEADA NAS LOJAS ASSOCIADAS
      if (!lojasData || lojasData.length === 0) {
        console.log('👤 Usuário é VISITANTE (sem lojas associadas)');
        setUserRole('visitante');
      } else {
        // Verificar se é gerente em alguma loja
        const lojasComoGerente = lojasData.filter(loja => loja.funcao === 'gerente');
        
        if (lojasComoGerente.length > 0) {
          if (lojasComoGerente.length > 1) {
            console.error('❌ CONFLITO: Usuário é gerente em múltiplas lojas');
            setError('Configuração inválida: Gerente em múltiplas lojas');
            setUserRole('erro');
          } else {
            console.log('💼 Usuário é GERENTE da loja:', lojasComoGerente[0].id_loja);
            setUserRole('gerente');
          }
        } else {
          // Se não é gerente, assume que é entregador
          console.log('🚚 Usuário é ENTREGADOR em', lojasData.length, 'loja(s)');
          setUserRole('entregador');
        }
      }

    } catch (error) {
      console.error('💥 Erro inesperado no carregamento:', error);
      setError('Erro inesperado: ' + error.message);
      resetToVisitor();
    } finally {
      setLoading(false);
      console.log('✅ Carregamento finalizado. Função:', userRole);
    }
  };

  // ============================================================================
  // 3. FUNÇÃO AUXILIAR: RESETAR PARA VISITANTE
  // ============================================================================
  /**
   * Reinicia todos os estados para usuário visitante (não autenticado)
   * Usado em casos de erro ou logout
   */
  const resetToVisitor = () => {
    setUser(null);
    setUserProfile(null);
    setUserRole('visitante');
    setUserLojas([]);
    setLoading(false);
  };

  // ============================================================================
  // 4. EFFECT: INICIALIZAÇÃO E OBSERVADOR DE AUTENTICAÇÃO
  // ============================================================================
  /**
   * Executa o carregamento inicial e fica observando mudanças de autenticação
   * Atualiza automaticamente quando usuário faz login/logout
   */
  useEffect(() => {
    // Carregamento inicial
    loadUserData();

    // Observar mudanças de estado de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Evento de autenticação:', event);
        
        if (event === 'SIGNED_IN') {
          // Usuário fez login - recarregar dados
          await loadUserData();
        } else if (event === 'SIGNED_OUT') {
          // Usuário fez logout - resetar para visitante
          console.log('👋 Usuário desconectado');
          resetToVisitor();
        }
      }
    );

    // Cleanup: Remover observador quando componente desmontar
    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
        console.log('🧹 Observador de autenticação removido');
      }
    };
  }, []);

  // ============================================================================
  // 5. FUNÇÃO: ATUALIZAR PERFIL DO USUÁRIO
  // ============================================================================
  /**
   * Atualiza dados do perfil na tabela 'usuarios'
   * ⚠️ Não permite alterar 'is_admin' via interface comum
   */
  const updateUserProfile = async (formData) => {
    try {
      setUpdating(true);
      setError(null);

      // Validações
      if (!userProfile?.uid) throw new Error('Perfil não carregado');
      if (!formData.nome_completo || !formData.telefone) {
        throw new Error('Nome completo e telefone são obrigatórios');
      }

      // Dados para atualização
      const updateData = {
        nome_completo: formData.nome_completo,
        nome_usuario: formData.nome_usuario || userProfile.nome_usuario,
        telefone: formData.telefone,
        foto: formData.foto || userProfile.foto
      };

      // Executar atualização
      const { error: updateError } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('uid', userProfile.uid);

      if (updateError) throw updateError;

      // Atualizar estado local
      setUserProfile(prev => ({ ...prev, ...updateData }));

      return { success: true, message: 'Perfil atualizado com sucesso!' };

    } catch (error) {
      const errorMsg = 'Erro ao atualizar: ' + error.message;
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setUpdating(false);
    }
  };

  // ============================================================================
  // 6. FUNÇÃO: RECARREGAR DADOS
  // ============================================================================
  /**
   * Força recarregamento completo dos dados do usuário
   * Útil após atualizações externas ou para sincronização
   */
  const reloadUserData = async () => {
    console.log('🔄 Recarregando dados do usuário...');
    await loadUserData();
  };

  // ============================================================================
  // 7. RETORNO DO HOOK
  // ============================================================================
  /**
   * Expõe estados e funções para componentes consumidores
   */
  return {
    // Estados
    user,
    userProfile,
    userRole, // 'admin', 'gerente', 'entregador', 'visitante'
    userLojas,
    loading,
    error,
    updating,
    
    // Funções
    updateUserProfile,
    reloadUserData
  };
};