// components/RouteGuard.js
import { useUserProfile } from '../hooks/useUserProfile';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const RouteGuard = ({ children, requiredRole }) => {
  const { userRole, loading, userProfile } = useUserProfile();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // ============================================================================
  // 1. VERIFICAÇÃO OTIMIZADA DE PERMISSÕES
  // ============================================================================
  useEffect(() => {
    // ⚡ NÃO BLOQUEIA SE JÁ ESTIVER CARREGADO
    if (!loading) {
      setIsChecking(false);
      
      // Hierarquia de permissões
      const rolesHierarchy = {
        'visitante': 0,
        'entregador': 1, 
        'gerente': 2,
        'admin': 3
      };

      const currentRoleLevel = rolesHierarchy[userRole] || 0;
      const requiredRoleLevel = rolesHierarchy[requiredRole] || 0;

      // 🔥 CORREÇÃO CRÍTICA: Só redireciona se usuário NÃO TEM permissão
      // E se não é um visitante tentando acessar página pública
      if (currentRoleLevel < requiredRoleLevel) {
        console.log(`🔒 Acesso negado: ${userRole} tentando acessar ${requiredRole}`);
        
        // Redireciona após pequeno delay para evitar flicker
        const timer = setTimeout(() => {
          router.push('/nao-autorizado');
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }
  }, [userRole, loading, requiredRole, router]);

  // ============================================================================
  // 2. LOADING SIMPLES E RÁPIDO
  // ============================================================================
  if (loading || isChecking) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 3. VERIFICAÇÃO FINAL (EVITA FALSOS POSITIVOS)
  // ============================================================================
  const rolesHierarchy = {
    'visitante': 0,
    'entregador': 1,
    'gerente': 2, 
    'admin': 3
  };
  
  const currentRoleLevel = rolesHierarchy[userRole] || 0;
  const requiredRoleLevel = rolesHierarchy[requiredRole] || 0;
  const hasPermission = currentRoleLevel >= requiredRoleLevel;

  if (!hasPermission) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Não Autorizado</h1>
          <p className="text-gray-600">
            Sua função <strong>{userRole}</strong> não tem acesso a esta página.
          </p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 4. RETORNO DOS FILHOS SE TUDO ESTIVER OK
  // ============================================================================
  return children;
};

export default RouteGuard;