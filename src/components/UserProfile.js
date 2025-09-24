// components/UserProfile.js - VERSÃO CORRIGIDA
// ==============================================================================
// COMPONENTE: PERFIL DO USUÁRIO (VERSÃO SIMPLIFICADA SEM HOOK)
// ==============================================================================
/**
 * Componente de perfil que RECEBE dados por props instead de usar hook
 * Elimina duplicação de chamadas e loops de carregamento
 */
const UserProfile = ({ userProfile, userRole, loading, error, isMobile = false }) => {
  // ============================================================================
  // 1. ESTADO DE CARREGAMENTO (AGORA USA PROP)
  // ============================================================================
  if (loading) {
    return (
      <div className="p-4 border-t" role="status" aria-label="Carregando perfil">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-purple-700 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-purple-700 rounded w-1/2"></div>
          <div className="h-3 bg-purple-700 rounded w-1/3 mt-2"></div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 2. TRATAMENTO DE ERRO (USA PROP)
  // ============================================================================
  if (error) {
    return (
      <div className="p-4 border-t" role="alert" aria-label="Erro ao carregar perfil">
        <p className="text-sm text-red-300">Erro ao carregar perfil.</p>
        <p className="text-xs text-red-400">Tente novamente ou contate o suporte.</p>
      </div>
    );
  }

  // ============================================================================
  // 3. USUÁRIO NÃO AUTENTICADO (USA PROP)
  // ============================================================================
  if (!userProfile) {
    return (
      <div className="p-4 border-t" role="region" aria-label="Status de visitante">
        <p className="text-sm text-purple-300">Visitante</p>
        <p className="text-xs text-purple-400">Faça login para acessar</p>
      </div>
    );
  }

  // ============================================================================
  // 4. RENDERIZAÇÃO SIMPLIFICADA (USA PROPS)
  // ============================================================================
  return (
    <div className={`p-4 border-t ${isMobile ? 'text-sm' : 'text-base'}`} role="region" aria-label="Perfil do usuário">
      <div className="space-y-2">
        {/* INFORMAÇÕES BÁSICAS */}
        <div className="flex items-center">
          {userProfile.foto && (
            <img
              src={userProfile.foto}
              alt={`${userProfile.nome_completo || userProfile.nome_usuario} foto de perfil`}
              className="w-8 h-8 rounded-full mr-3 border-2 border-purple-600"
              loading="lazy"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {userProfile.nome_completo || userProfile.nome_usuario}
            </p>
            <p className="text-xs text-purple-300 truncate">
              {userProfile.email}
            </p>
          </div>
        </div>

        {/* FUNÇÃO/ROLE */}
        <div className="bg-purple-700 rounded p-1">
          <p className="text-xs text-center text-white">
            {userRole === 'admin' && '👑 Admin'}
            {userRole === 'gerente' && '💼 Gerente'}
            {userRole === 'entregador' && '🚚 Entregador'}
            {userRole === 'visitante' && '👤 Visitante'}
          </p>
        </div>

        {/* STATUS DE CONEXÃO */}
        <div className="flex items-center justify-between text-xs text-purple-400">
          <span>🟢 Conectado</span>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;