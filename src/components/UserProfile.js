// components/UserProfile.js
import { useUserProfile } from '../hooks/useUserProfile';

const UserProfile = ({ isMobile = false }) => {
  const { userProfile, userRole, userLojas, loading } = useUserProfile();

  if (loading) {
    return (
      <div className="p-4 border-t">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-3 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="p-4 border-t">
        <p className="text-sm text-gray-600">Visitante</p>
        <p className="text-xs text-gray-500">Faça login para acessar</p>
      </div>
    );
  }

  return (
    <div className="p-4 border-t">
      {/* CABEÇALHO DO PERFIL */}
      <div className="flex items-center mb-3">
        {/* FOTO DO USUÁRIO */}
        {userProfile.foto && (
          <img
            src={userProfile.foto}
            alt="Foto do usuário"
            className="w-10 h-10 rounded-full mr-3"
          />
        )}
        
        <div className="flex-1 min-w-0">
          {/* NOME DO USUÁRIO */}
          <p className="text-sm font-semibold text-gray-800 truncate">
            {userProfile.nome_completo || userProfile.nome_usuario}
          </p>
          
          {/* EMAIL */}
          <p className="text-xs text-gray-600 truncate">
            {userProfile.email}
          </p>
        </div>
      </div>

      {/* FUNÇÃO/ROLE */}
      <div className="bg-purple-100 rounded-lg p-2 mb-3">
        <p className="text-xs font-medium text-purple-800 text-center">
          {userRole === 'admin' && 'Administrador'}
          {userRole === 'gerente' && 'Gerente'}
          {userRole === 'entregador' && 'Entregador'}
          {userRole === 'visitante' && 'Visitante'}
        </p>
      </div>

      {/* LOJAS ASSOCIADAS (APENAS PARA ENTREGADORES E GERENTES) */}
      {(userRole === 'entregador' || userRole === 'gerente') && userLojas.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-700 mb-2">
            {userRole === 'gerente' ? 'Loja:' : 'Lojas:'}
          </p>
          <div className="space-y-1">
            {userLojas.map((loja, index) => (
              <div key={index} className="flex items-center text-xs text-gray-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span className="truncate">
                  {loja.loja_nome} 
                  <span className="text-purple-600 font-medium"> ({loja.id_loja})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MENSAGEM ESPECIAL PARA ADMINISTRADORES */}
      {userRole === 'admin' && (
        <div className="bg-blue-50 rounded-lg p-2 mb-3">
          <p className="text-xs text-blue-800 text-center">
            👑 Acesso total ao sistema
          </p>
        </div>
      )}

      {/* STATUS DE CONEXÃO */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>● Online</span>
        <span>{new Date().toLocaleDateString('pt-BR')}</span>
      </div>
    </div>
  );
};

export default UserProfile;