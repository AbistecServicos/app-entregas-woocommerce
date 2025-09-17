// pages/perfil.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useUserProfile } from '../hooks/useUserProfile';
import EditUsuarioModal from '../components/EditUsuarioModal';
import EditLojaModal from '../components/EditLojaModal';

// ==============================================================================
// PÁGINA: PERFIL DO USUÁRIO
// ==============================================================================
export default function Perfil() {
  const router = useRouter();
  const { userProfile, userRole, userLojas, loading, error } = useUserProfile();
  const [modalUsuarioOpen, setModalUsuarioOpen] = useState(false);
  const [modalLojaOpen, setModalLojaOpen] = useState(false);
  const [lojaSelecionada, setLojaSelecionada] = useState(null);

  // ============================================================================
  // 1. REDIRECIONAR SE NÃO ESTIVER LOGADO
  // ============================================================================
  if (!loading && !userProfile) {
    router.push('/login');
    return null;
  }

  // ============================================================================
  // 2. ABRIR MODAL DE EDIÇÃO DA LOJA
  // ============================================================================
  const abrirModalLoja = (loja) => {
    setLojaSelecionada(loja);
    setModalLojaOpen(true);
  };

  // ============================================================================
  // 3. RENDERIZAÇÃO DA PÁGINA
  // ============================================================================
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      
      {/* CABEÇALHO */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-purple-800 mb-2">👤 Meu Perfil</h1>
        <p className="text-gray-600">Gerencie suas informações pessoais e de entrega</p>
      </div>

      {loading ? (
        <div className="text-center">
          <p className="text-purple-600">Carregando...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
          <p>Erro: {error}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* ================================================================== */}
          {/* CARD: DADOS DO USUÁRIO */}
          {/* ================================================================== */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-purple-800 mb-4">📋 Dados Pessoais</h2>
            
            <div className="space-y-3 mb-4">
              {userProfile.foto && (
                <div className="text-center">
                  <img
                    src={userProfile.foto}
                    alt="Foto do perfil"
                    className="w-20 h-20 rounded-full mx-auto border-2 border-purple-600"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-600">Nome Completo</label>
                <p className="text-gray-800 font-medium">{userProfile.nome_completo || 'Não informado'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">Nome de Usuário</label>
                <p className="text-gray-800">{userProfile.nome_usuario || 'Não informado'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-800">{userProfile.email}</p>
              </div>
              
              {userProfile.telefone && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Telefone</label>
                  <p className="text-gray-800">{userProfile.telefone}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setModalUsuarioOpen(true)}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors"
            >
              ✏️ Editar Dados Pessoais
            </button>
          </div>

          {/* ================================================================== */}
          {/* CARD: LOJAS ASSOCIADAS */}
          {/* ================================================================== */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-purple-800 mb-4">🏪 Lojas Associadas</h2>
            
            {userLojas.length === 0 ? (
              <p className="text-gray-600 text-center py-4">Nenhuma loja associada</p>
            ) : (
              <div className="space-y-3">
                {userLojas.map((loja) => (
                  <div key={loja.id} className="border rounded-lg p-3 hover:bg-gray-50">
                    <h3 className="font-semibold text-gray-800">{loja.loja_nome}</h3>
                    <p className="text-sm text-gray-600">ID: {loja.id_loja}</p>
                    <p className="text-sm text-purple-600">Função: {loja.funcao}</p>
                    
                    <div className="mt-2 text-sm text-gray-700">
                      <p>🚗 Veículo: {loja.veiculo || 'Não informado'}</p>
                      <p>📦 Carga máxima: {loja.carga_maxima || '0'} kg</p>
                      <p>📍 Perímetro: {loja.perimetro_entrega || 'Não definido'}</p>
                    </div>

                    <button
                      onClick={() => abrirModalLoja(loja)}
                      className="mt-2 w-full bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      ✏️ Editar Esta Loja
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAIS */}
      {/* ====================================================================== */}
      <EditUsuarioModal
        isOpen={modalUsuarioOpen}
        onClose={() => setModalUsuarioOpen(false)}
        userProfile={userProfile}
      />
      
      {lojaSelecionada && (
        <EditLojaModal
          isOpen={modalLojaOpen}
          onClose={() => setModalLojaOpen(false)}
          loja={lojaSelecionada}
        />
      )}
    </div>
  );
}