// components/RouteGuard.js
import { useUserProfile } from '../hooks/useUserProfile';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const RouteGuard = ({ children, requiredRole }) => {
  const { userRole, loading } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Definir hierarquia de permissões
      const rolesHierarchy = {
        'visitante': 0,
        'entregador': 1,
        'gerente': 2,
        'admin': 3
      };

      // Verificar se usuário tem permissão
      const hasPermission = rolesHierarchy[userRole] >= rolesHierarchy[requiredRole];
      
      if (!hasPermission) {
        // Redirecionar para página não autorizada ou home
        router.push('/');
      }
    }
  }, [userRole, loading, requiredRole, router]);

  // Mostrar loading enquanto verifica permissões
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Verificação final (caso o useEffect não tenha redirecionado ainda)
  const rolesHierarchy = {
    'visitante': 0,
    'entregador': 1,
    'gerente': 2,
    'admin': 3
  };
  
  const hasPermission = rolesHierarchy[userRole] >= rolesHierarchy[requiredRole];

  if (!hasPermission) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Acesso Não Autorizado</h1>
          <p className="text-gray-600 mt-2">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return children;
};

export default RouteGuard;