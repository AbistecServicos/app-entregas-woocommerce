// components/UserProfile.js (VERSÃO SIMPLIFICADA)
import { useUserProfile } from '../hooks/useUserProfile';

// ==============================================================================
// COMPONENTE: PERFIL DO USUÁRIO (VERSÃO SIMPLIFICADA)
// ==============================================================================
/**
 * Componente de perfil simplificado para sidebar, exibindo informações básicas
 * (foto, nome, email, função e status) sem opções de edição.
 * Utiliza hook useUserProfile para dados e suporta modo mobile.
 * Aprimoramentos: Acessibilidade, feedback de erro e design responsivo.
 */
const UserProfile = ({ isMobile = false }) => {
  // ============================================================================
  // 1. OBTENÇÃO DE DADOS DO USUÁRIO
  // ============================================================================
  /**
   * Usa o hook useUserProfile para obter perfil, função e estado de carregamento.
   * Desestruturação para acessar os valores retornados.
   */
  const { userProfile, userRole, loading, error } = useUserProfile();

  // ============================================================================
  // 2. ESTADO DE CARREGAMENTO
  // ============================================================================
  /**
   * Exibe um placeholder animado durante o carregamento dos dados.
   * Design aprimorado com múltiplos elementos para simular conteúdo.
   */
  if (loading) {
    return (
      <div
        className="p-4 border-t"
        role="status"
        aria-label="Carregando perfil do usuário"
      >
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-purple-700 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-purple-700 rounded w-1/2"></div>
          <div className="h-3 bg-purple-700 rounded w-1/3 mt-2"></div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 3. TRATAMENTO DE ERRO
  // ============================================================================
  /**
   * Exibe uma mensagem de erro se a busca de perfil falhar.
   * Permite ao usuário tentar novamente ou entrar em contato com suporte.
   */
  if (error) {
    return (
      <div
        className="p-4 border-t"
        role="alert"
        aria-label="Erro ao carregar perfil"
      >
        <p className="text-sm text-red-300">Erro ao carregar perfil.</p>
        <p className="text-xs text-red-400">Tente novamente ou contate o suporte.</p>
      </div>
    );
  }

  // ============================================================================
  // 4. USUÁRIO NÃO AUTENTICADO
  // ============================================================================
  /**
   * Exibe mensagem para visitantes não autenticados, incentivando login.
   */
  if (!userProfile) {
    return (
      <div
        className="p-4 border-t"
        role="region"
        aria-label="Status de visitante"
      >
        <p className="text-sm text-purple-300">Visitante</p>
        <p className="text-xs text-purple-400">Faça login para acessar</p>
      </div>
    );
  }

  // ============================================================================
  // 5. RENDERIZAÇÃO SIMPLIFICADA
  // ============================================================================
  /**
   * Exibe informações do usuário autenticado com foto, nome, email, função e status.
   * Ajustes para responsividade em modo mobile e acessibilidade.
   */
  return (
    <div
      className={`p-4 border-t ${isMobile ? 'text-sm' : 'text-base'}`}
      role="region"
      aria-label="Perfil do usuário"
    >
      {/* INFORMAÇÕES BÁSICAS DO USUÁRIO */}
      <div className="space-y-2">
        {/* NOME E EMAIL */}
        <div className="flex items-center">
          {userProfile.foto && (
            <img
              src={userProfile.foto}
              alt={`${userProfile.nome_completo || userProfile.nome_usuario} foto de perfil`}
              className="w-8 h-8 rounded-full mr-3 border-2 border-purple-600"
              loading="lazy" // Otimização de carregamento
            />
          )}
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold text-white truncate"
              title={userProfile.nome_completo || userProfile.nome_usuario}
            >
              {userProfile.nome_completo || userProfile.nome_usuario}
            </p>
            <p
              className="text-xs text-purple-300 truncate"
              title={userProfile.email}
            >
              {userProfile.email}
            </p>
          </div>
        </div>

        {/* FUNÇÃO/ROLE (APENAS TEXTO) */}
        <div className="bg-purple-700 rounded p-1">
          <p
            className="text-xs text-center text-white"
            role="status"
            aria-label={`Função: ${userRole}`}
          >
            {userRole === 'admin' && '👑 Admin'}
            {userRole === 'gerente' && '💼 Gerente'}
            {userRole === 'entregador' && '🚚 Entregador'}
            {userRole === 'visitante' && '👤 Visitante'}
          </p>
        </div>

        {/* STATUS DE CONEXÃO (SIMPLES) */}
        <div
          className="flex items-center justify-between text-xs text-purple-400"
          role="status"
          aria-label="Status de conexão"
        >
          <span>🟢 Conectado</span>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;