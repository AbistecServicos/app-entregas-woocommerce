// hooks/useUserProfile.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ==============================================================================
// HOOK PERSONALIZADO: useUserProfile
// ==============================================================================
/**
 * Hook personalizado para gerenciar dados do usuário logado
 * Responsável por: autenticação, permissões e dados do perfil
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
  // 3. RETORNO DO HOOK
  // ============================================================================
  return { 
    user,
    userProfile, 
    userRole, 
    userLojas, 
    loading, 
    error 
  };
};