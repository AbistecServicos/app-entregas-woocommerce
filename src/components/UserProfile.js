// components/UserProfile.js
import { useState } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import EditProfileModal from './EditProfileModal';

// ==============================================================================
// COMPONENTE: PERFIL DO USUÁRIO
// ==============================================================================
/**
 * Componente que exibe e permite editar o perfil do usuário logado
 * Localizado no footer do sidebar com informações e botão de edição
 */
const UserProfile = ({ isMobile = false }) => {
  const { userProfile, userRole, userLojas, loading } = useUserProfile();
  const [modalOpen, setModalOpen] = useState(false);

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
  // 3. RENDERIZAÇÃO DO PERFIL
  // ============================================================================
  return (
    <div className="p-4 border-t">
      
      {/* ====================================================================== */}
      {/* BOTÃO EDITAR PERFIL */}
      {/* ====================================================================== */}
      <button
        onClick={() => setModalOpen(true)}
        className="w-full text-left mb-3 p-2 bg-purple-700 hover:bg-purple-600 rounded-lg transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">✏️ Editar Meu Perfil</span>
          <span className="text-purple-300 text-xs">Clique aqui</span>
        </div>
      </button>

      {/* ====================================================================== */}
      {/* INFORMAÇÕES DO USUÁRIO */}
      {/* ====================================================================== */}
      <div className="space-y-2">
        
        {/* CABEÇALHO COM FOTO E NOME */}
        <div className="flex items-center">
          {userProfile.foto && (
            <img
              src={userProfile.foto}
              alt="Foto do usuário"
              className="w-10 h-10 rounded-full mr-3 border-2 border-purple-600"
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
        <div className="bg-purple-700 rounded-lg p-2">
          <p className="text-xs font-medium text-center text-white">
            {userRole === 'admin' && '👑 Administrador'}
            {userRole === 'gerente' && '💼 Gerente'}
            {userRole === 'entregador' && '🚚 Entregador'}
            {userRole === 'visitante' && '👤 Visitante'}
          </p>
        </div>

        {/* INFORMAÇÕES DE CONTATO */}
        <div className="text-xs text-purple-300 space-y-1">
          {userProfile.telefone && (
            <p>📞 {userProfile.telefone}</p>
          )}
          {userProfile.nome_usuario && userProfile.nome_usuario !== userProfile.nome_completo && (
            <p>👤 {userProfile.nome_usuario}</p>
          )}
        </div>

        {/* LOJAS ASSOCIADAS (ENTREGADORES E GERENTES) */}
        {(userRole === 'entregador' || userRole === 'gerente') && userLojas.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-purple-300 mb-1">
              {userRole === 'gerente' ? '🏪 Minha Loja:' : '🏪 Lojas:'}
            </p>
            <div className="space-y-1">
              {userLojas.map((loja, index) => (
                <div key={index} className="flex items-center text-xs text-purple-200">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  <span className="truncate">
                    {loja.loja_nome}
                    <span className="text-white font-medium ml-1">
                      ({loja.id_loja})
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DETALHES ESPECÍFICOS PARA ENTREGADORES */}
        {userRole === 'entregador' && userLojas.length > 0 && (
          <div className="mt-3 p-2 bg-purple-700 rounded-lg">
            <p className="text-xs font-medium text-white mb-1">🚗 Detalhes de Entrega:</p>
            <div className="text-xs text-purple-200 space-y-1">
              <p>Veículo: {userLojas[0]?.veiculo || 'Não informado'}</p>
              {userLojas[0]?.carga_maxima > 0 && (
                <p>Carga máxima: {userLojas[0]?.carga_maxima}kg</p>
              )}
              {userLojas[0]?.perimetro_entrega && (
                <p>Perímetro: {userLojas[0]?.perimetro_entrega}</p>
              )}
            </div>
          </div>
        )}

        {/* MENSAGEM ESPECIAL PARA ADMINISTRADORES */}
        {userRole === 'admin' && (
          <div className="bg-blue-600 rounded-lg p-2 mt-2">
            <p className="text-xs text-white text-center">
              ⭐ Acesso total ao sistema
            </p>
          </div>
        )}

        {/* STATUS DE CONEXÃO */}
        <div className="flex items-center justify-between text-xs text-purple-400 mt-2">
          <span>🟢 Online</span>
          <span>{new Date().toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* MODAL DE EDIÇÃO DE PERFIL */}
      {/* ====================================================================== */}
      <EditProfileModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        userProfile={userProfile}
        userRole={userRole}
        userLojas={userLojas}
      />
    </div>
  );
};

export default UserProfile;