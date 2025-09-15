// components/UserProfile.js
import { useUserProfile } from '../hooks/useUserProfile';

const UserProfile = () => {
  const { userProfile, userRole, userLojas, loading } = useUserProfile();

  if (loading) {
    return <div className="p-4">Carregando...</div>;
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
      {/* Foto do usuário */}
      {userProfile.foto && (
        <img
          src={userProfile.foto}
          alt="Foto do usuário"
          className="w-12 h-12 rounded-full mx-auto mb-3"
        />
      )}
      
      {/* Nome e Email */}
      <p className="text-sm font-semibold text-center truncate">
        {userProfile.nome_completo || userProfile.nome_usuario}
      </p>
      <p className="text-xs text-gray-600 text-center truncate mb-2">
        {userProfile.email}
      </p>

      {/* Função/Role */}
      <div className="bg-purple-100 rounded-lg p-2 mb-2">
        <p className="text-xs font-medium text-purple-800 text-center">
          {userRole === 'admin' ? 'Administrador' : 
           userRole === 'gerente' ? 'Gerente' : 
           userRole === 'entregador' ? 'Entregador' : 'Visitante'}
        </p>
      </div>

      {/* Lojas associadas */}
      {userLojas.length > 0 && (
        <div className="text-xs text-gray-600">
          <p className="font-medium mb-1">Lojas:</p>
          {userLojas.map(loja => (
            <p key={loja.id} className="truncate">• {loja.loja_nome}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserProfile;