// components/UserProfile.js (VERSÃO SIMPLIFICADA)
import { useUserProfile } from '../hooks/useUserProfile';

// ==============================================================================
// COMPONENTE: PERFIL DO USUÁRIO (VERSÃO SIMPLIFICADA)
// ==============================================================================
/**
 * Versão simplificada para o sidebar - apenas informações básicas
 * sem botões de edição (agora na página /perfil)
 */
const UserProfile = ({ isMobile = false }) => {
  const { userProfile, userRole, loading } = useUserProfile();

  // ============================================================================
  // 1. ESTADO DE CARREGAMENTO
  // ============================================================================
  if (loading) {
    return (
      <div className="p-4 border-t">
        <div className="animate-pulse">
          <div className="h-4 bg-purple-700 rounded mb-2"></div>
          <div className="h-3 bg-purple-700 rounded"></div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 2. USUÁRIO NÃO AUTENTICADO
  // ============================================================================
  if (!userProfile) {
    return (
      <div className="p-4 border-t">
        <p className="text-sm text-purple-300">Visitante</p>
        <p className="text-xs text-purple-400">Faça login para acessar</p>
      </div>
    );
  }

  // ============================================================================
  // 3. RENDERIZAÇÃO SIMPLIFICADA
  // ============================================================================
  return (
    <div className="p-4 border-t">
      
      {/* INFORMAÇÕES BÁSICAS DO USUÁRIO */}
      <div className="space-y-2">
        
        {/* NOME E EMAIL */}
        <div className="flex items-center">
          {userProfile.foto && (
            <img
              src={userProfile.foto}
              alt="Foto do usuário"
              className="w-8 h-8 rounded-full mr-3 border-2 border-purple-600"
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

        {/* FUNÇÃO/ROLE (APENAS TEXTO) */}
        <div className="bg-purple-700 rounded p-1">
          <p className="text-xs text-center text-white">
            {userRole === 'admin' && '👑 Admin'}
            {userRole === 'gerente' && '💼 Gerente'}
            {userRole === 'entregador' && '🚚 Entregador'}
            {userRole === 'visitante' && '👤 Visitante'}
          </p>
        </div>

        {/* STATUS DE CONEXÃO (SIMPLES) */}
        <div className="flex items-center justify-between text-xs text-purple-400">
          <span>🟢 Conectado</span>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;