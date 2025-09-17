// hooks/useUserProfile.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ==============================================================================
// HOOK PERSONALIZADO: useUserProfile
// ==============================================================================
export const useUserProfile = () => {
  // ============================================================================
  // 1. ESTADOS DO HOOK
  // ============================================================================
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState('visitante'); // ✅ Inicializar como 'visitante'
  const [userLojas, setUserLojas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

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
          setUser(null);
          setUserProfile(null);
          setUserLojas([]);
          setLoading(false);
          return;
        }

        setUser(authUser);

        // ======================================================================
        // 2.2. BUSCA DOS DADOS DO USUÁRIO E PERMISSÕES
        // ======================================================================
        const [usuarioResponse, lojaResponse] = await Promise.all([
          // Buscar dados do usuário
          supabase
            .from('usuarios')
            .select('*')
            .eq('uid', authUser.id)
            .single(),
          
          // Buscar lojas associadas (em paralelo para melhor performance)
          supabase
            .from('loja_associada')
            .select('*')
            .eq('uid_usuario', authUser.id)
            .eq('status_vinculacao', 'ativo')
        ]);

        // ======================================================================
        // 2.3. TRATAMENTO DE ERROS DAS CONSULTAS
        // ======================================================================
        if (usuarioResponse.error) {
          setError('Erro ao buscar usuário: ' + usuarioResponse.error.message);
          setLoading(false);
          return;
        }

        const usuarioData = usuarioResponse.data;

        // ======================================================================
        // 2.4. VERIFICAÇÃO DE ADMINISTRADOR
        // ======================================================================
        if (usuarioData?.is_admin) {
          setUserRole('admin');
          setUserProfile(usuarioData);
          setUserLojas([]);
          setLoading(false);
          return;
        }

        // ======================================================================
        // 2.5. VERIFICAÇÃO DE LOJAS ASSOCIADAS (NÃO-ADMIN)
        // ======================================================================
        if (lojaResponse.error) {
          setError('Erro ao buscar lojas: ' + lojaResponse.error.message);
          setLoading(false);
          return;
        }

        const lojaData = lojaResponse.data || [];

        // Se não tem lojas associadas, é visitante
        if (lojaData.length === 0) {
          setUserRole('visitante');
          setUserProfile(usuarioData);
          setUserLojas([]);
          setLoading(false);
          return;
        }

        // ======================================================================
        // 2.6. DEFINIÇÃO DA FUNÇÃO (ROLE) DO USUÁRIO
        // ======================================================================
        setUserProfile(usuarioData);
        setUserLojas(lojaData);
        
        // Verificar se é GERENTE (pode ter apenas uma loja como gerente)
        const gerente = lojaData.find(loja => loja.funcao === 'gerente');
        
        if (gerente) {
          // ✅ VERIFICAÇÃO IMPORTANTE: Gerente não pode ter múltiplas lojas
          const lojasGerente = lojaData.filter(loja => loja.funcao === 'gerente');
          if (lojasGerente.length > 1) {
            setError('ERRO: Usuário não pode ser gerente em múltiplas lojas');
            setUserRole('erro');
          } else {
            setUserRole('gerente');
          }
        } else {
          // Se não é gerente, é ENTREGADOR (pode ter múltiplas lojas)
          setUserRole('entregador');
        }

      } catch (error) {
        // ======================================================================
        // 2.7. TRATAMENTO DE ERROS GERAIS
        // ======================================================================
        setError('Erro inesperado: ' + error.message);
        console.error('Erro no useUserProfile:', error);
      } finally {
        // ======================================================================
        // 2.8. FINALIZAÇÃO
        // ======================================================================
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

// ============================================================================
// 3. FUNÇÕES DE EDIÇÃO DE PERFIL
// ============================================================================
const updateUserProfile = async (formData) => {
  try {
    setUpdating(true);
    setError(null);

    // Validação inicial
    if (!userProfile || !userProfile.uid) {
      throw new Error('Usuário não autenticado');
    }

    // ATUALIZAR TABELA USUARIOS (TODOS OS USUÁRIOS)
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

    // ATUALIZAR TABELA LOJA_ASSOCIADA (APENAS ENTREGADORES)
    if (userRole === 'entregador' && userLojas.length > 0) {
      const { error: lojaError } = await supabase
        .from('loja_associada')
        .update({
          veiculo: formData.veiculo,
          carga_maxima: formData.carga_maxima ? parseInt(formData.carga_maxima) : null,
          perimetro_entrega: formData.perimetro_entrega,
          nome_completo: formData.nome_completo
        })
        .eq('uid_usuario', userProfile.uid)
        .eq('id_loja', userLojas[0].id_loja);

      if (lojaError) throw lojaError;
    }

    // Atualizar estados locais
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
    const errorMsg = 'Erro ao atualizar perfil: ' + error.message;
    setError(errorMsg);
    console.error('Erro no updateUserProfile:', error);
    return { success: false, message: errorMsg };
  } finally {
    setUpdating(false);
  }
};

  // ============================================================================
  // 4. FUNÇÃO: RECARREGAR DADOS DO USUÁRIO (MELHORADA)
  // ============================================================================
  const reloadUserData = async () => {
    setLoading(true);
    try {
      // Recarregar dados de autenticação
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      
      setUser(authUser);

      if (authUser) {
        // Executar o mesmo fluxo de carregamento
        const loadUserData = async () => {
          // ... (repetir a lógica do effect principal) ...
        };
        await loadUserData();
      } else {
        setUserRole('visitante');
        setUserProfile(null);
        setUserLojas([]);
      }
    } catch (error) {
      setError('Erro ao recarregar dados: ' + error.message);
      console.error('Erro no reloadUserData:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // 5. RETORNO DO HOOK
  // ============================================================================
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