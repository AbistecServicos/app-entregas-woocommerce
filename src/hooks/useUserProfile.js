// hooks/useUserProfile.js
import { useState, useEffect } from 'react'; // ✅ Importações necessárias
import { supabase } from '../lib/supabase'; // ✅ Cliente Supabase

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
  const [user, setUser] = useState(null);           // Dados de autenticação do Supabase
  const [userProfile, setUserProfile] = useState(null); // Dados da tabela 'usuarios'
  const [userRole, setUserRole] = useState('');     // Função: admin, gerente, entregador, visitante
  const [userLojas, setUserLojas] = useState([]);   // Lojas associadas ao usuário
  const [loading, setLoading] = useState(true);     // Estado de carregamento

  // ============================================================================
  // 2. EFFECT PRINCIPAL - CARREGAMENTO DOS DADOS
  // ============================================================================
  /**
   * useEffect executa quando o componente é montado ([] como dependência)
   * Busca todos os dados do usuário de forma assíncrona
   */
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // ======================================================================
        // 2.1. VERIFICAÇÃO DE AUTENTICAÇÃO
        // ======================================================================
        /**
         * Primeiro passo: verificar se usuário está autenticado no Supabase
         * Se não estiver, para a execução aqui
         */
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          setLoading(false);
          return; // Usuário não autenticado
        }

        setUser(authUser); // Salva dados de autenticação

        // ======================================================================
        // 2.2. VERIFICAÇÃO DE ADMINISTRADOR
        // ======================================================================
        /**
         * Administradores têm acesso total (is_admin = true)
         * Não precisam de vinculação com lojas
         */
        const { data: usuarioData, error: userError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('uid', authUser.id)
          .single();

        if (userError) {
          console.error('Erro ao buscar usuário:', userError);
          setLoading(false);
          return;
        }

        // Se for admin, define role e finaliza
        if (usuarioData?.is_admin) {
          setUserRole('admin');
          setUserProfile(usuarioData);
          setLoading(false);
          return; // Interrompe aqui - admin não precisa de lojas
        }

        // ======================================================================
        // 2.3. BUSCA DE LOJAS ASSOCIADAS (NÃO-ADMIN)
        // ======================================================================
        /**
         * Para usuários não-admin, busca lojas vinculadas
         * Filtra apenas por registros com status 'ativo'
         */
        const { data: lojaData, error: lojaError } = await supabase
          .from('loja_associada')
          .select('*')
          .eq('uid_usuario', authUser.id)
          .eq('status_vinculacao', 'ativo');

        if (lojaError) {
          console.error('Erro ao buscar lojas:', lojaError);
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
        setUserLojas(lojaData); // Salva lista de lojas
        
        // Verifica se é GERENTE (deve ter apenas UMA loja)
        const gerente = lojaData.find(loja => loja.funcao === 'gerente');
        
        if (gerente) {
          // VALIDAÇÃO: Gerente não pode ter múltiplas lojas
          if (lojaData.length > 1) {
            console.error('ERRO: Gerente não pode ter múltiplas lojas');
            setUserRole('erro'); // Estado de erro para tratamento
          } else {
            setUserRole('gerente');
          }
        } else {
          // Se não é gerente, é ENTREGADOR (pode ter múltiplas lojas)
          setUserRole('entregador');
        }

        // Salva perfil do usuário
        setUserProfile(usuarioData);

      } catch (error) {
        // ======================================================================
        // 2.5. TRATAMENTO DE ERROS GERAIS
        // ======================================================================
        console.error('Erro ao carregar perfil:', error);
      } finally {
        // ======================================================================
        // 2.6. FINALIZAÇÃO (EXECUTA SEMPRE)
        // ======================================================================
        setLoading(false); // Finaliza carregamento independente do resultado
      }
    };

    // Executa a função de carregamento
    loadUserData();
  }, []); // Array vazio = executa apenas uma vez ao montar

  // ============================================================================
  // 3. RETORNO DO HOOK
  // ============================================================================
  /**
   * Retorna todos os estados e funções para os componentes usarem
   */
  return { 
    user,           // Dados de autenticação do Supabase
    userProfile,    // Dados da tabela usuarios
    userRole,       // Função: admin, gerente, entregador, visitante, erro
    userLojas,      // Array de lojas associadas
    loading         // Boolean - true enquanto carrega dados
  };
};