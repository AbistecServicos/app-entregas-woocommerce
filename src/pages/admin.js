// pages/admin.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';
import RouteGuard from '../components/RouteGuard';
import DetalheLojaModal from '../components/OrderModal/DetalheLojaModal';

// ==============================================================================
// PÁGINA DE ADMINISTRAÇÃO COM UPLOAD DE LOGO
// ==============================================================================
export default function Admin() {
  // ============================================================================
  // 1. ESTADOS E HOOKS
  // ============================================================================
  const { userRole, loading: userLoading } = useUserProfile();
  const [activeTab, setActiveTab] = useState('lojas');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Estados para o modal de detalhes da loja
  const [selectedLoja, setSelectedLoja] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados para dados das abas
  const [lojas, setLojas] = useState([]);
  const [usuariosPendentes, setUsuariosPendentes] = useState([]);
  const [associacoes, setAssociacoes] = useState([]);

  // ============================================================================
  // 2. EFFECT: CARREGAR DADOS COM BASE NA ABA ATIVA
  // ============================================================================
  useEffect(() => {
    if (activeTab === 'lojas') {
      loadLojas();
    } else if (activeTab === 'usuarios') {
      loadUsuariosPendentes();
    } else if (activeTab === 'associacoes') {
      loadAssociacoes();
    }
  }, [activeTab]);

  // ============================================================================
  // 3. FUNÇÕES: CARREGAMENTO DE DADOS
  // ============================================================================
  
  const loadLojas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lojas')
        .select('*')
        .order('loja_nome');
      
      if (error) throw error;
      setLojas(data || []);
    } catch (err) {
      setError('Erro ao carregar lojas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUsuariosPendentes = async () => {
    try {
      setLoading(true);
      const { data: usuariosAssociados, error: errorAssociados } = await supabase
        .from('loja_associada')
        .select('uid_usuario')
        .eq('status_vinculacao', 'ativo');

      if (errorAssociados) {
        throw new Error('Erro ao buscar usuários associados: ' + errorAssociados.message);
      }

      const uidsAssociados = usuariosAssociados?.map(ua => ua.uid_usuario) || [];

      let query = supabase
        .from('usuarios')
        .select('*');

      if (uidsAssociados.length > 0) {
        query = query.not('uid', 'in', `(${uidsAssociados.map(uid => `"${uid}"`).join(',')})`);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error('Erro ao buscar usuários pendentes: ' + error.message);
      }

      setUsuariosPendentes(data || []);

    } catch (err) {
      setError('Erro ao carregar usuários: ' + err.message);
      console.error('Erro detalhado:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAssociacoes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('loja_associada')
        .select(`
          *,
          usuarios:uid_usuario(nome_completo, email),
          lojas:id_loja(loja_nome)
        `)
        .order('ultimo_status_vinculacao', { ascending: false });
      
      if (error) throw error;
      setAssociacoes(data || []);
    } catch (err) {
      setError('Erro ao carregar associações: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // 4. FUNÇÕES: AÇÕES DO ADMIN
  // ============================================================================
  
  const handleCriarLoja = async (dadosLoja) => {
    try {
      setLoading(true);
      setError(null);
      
      let loja_logo_url = null;
      
      if (dadosLoja.loja_logo instanceof File) {
        const fileExt = dadosLoja.loja_logo.name.split('.').pop();
        const fileName = `logo_loja_${dadosLoja.id_loja}_${Date.now()}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('box')
          .upload(filePath, dadosLoja.loja_logo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('box')
          .getPublicUrl(filePath);
        
        loja_logo_url = publicUrl;
      }
      
      const { error } = await supabase
        .from('lojas')
        .insert([{
          id_loja: dadosLoja.id_loja,
          loja_nome: dadosLoja.loja_nome,
          loja_endereco: dadosLoja.loja_endereco,
          loja_telefone: dadosLoja.loja_telefone,
          loja_perimetro_entrega: dadosLoja.loja_perimetro_entrega,
          loja_logo: loja_logo_url,
          cnpj: dadosLoja.cnpj,
          ativa: true
        }]);
      
      if (error) throw error;
      
      setSuccess('Loja criada com sucesso!');
      await loadLojas();
    } catch (err) {
      setError('Erro ao criar loja: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssociarGerente = async (usuarioId, lojaId) => {
    try {
      setLoading(true);
      setError(null);
      
      const [{ data: usuario }, { data: loja }] = await Promise.all([
        supabase.from('usuarios').select('*').eq('uid', usuarioId).single(),
        supabase.from('lojas').select('*').eq('id_loja', lojaId).single()
      ]);
      
      if (!usuario || !loja) throw new Error('Usuário ou loja não encontrados');
      
      const { error } = await supabase
        .from('loja_associada')
        .insert([{
          uid_usuario: usuarioId,
          nome_completo: usuario.nome_completo,
          id_loja: lojaId,
          loja_nome: loja.loja_nome,
          loja_endereco: loja.loja_endereco,
          loja_telefone: loja.loja_telefone,
          funcao: 'gerente',
          status_vinculacao: 'ativo',
          ultimo_status_vinculacao: new Date().toISOString()
        }]);
      
      if (error) throw error;
      
      setSuccess('Gerente associado com sucesso!');
      await loadAssociacoes();
      await loadUsuariosPendentes();
    } catch (err) {
      setError('Erro ao associar gerente: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // 5. FUNÇÃO: EXCLUIR USUÁRIO PENDENTE
  // ============================================================================
  const handleExcluirUsuario = async (usuario) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${usuario.nome_completo}"?\n\nEsta ação é irreversível e removerá o usuário do sistema.`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Primeiro, excluir da tabela de autenticação do Supabase
      const { error: authError } = await supabase.auth.admin.deleteUser(usuario.uid);
      
      if (authError) {
        console.warn('Erro ao excluir da autenticação (pode ser que o usuário já não exista):', authError.message);
        // Continua mesmo com erro, pois o usuário pode já ter sido excluído da auth mas não da tabela
      }

      // 2. Depois, excluir da tabela usuarios
      const { error: dbError } = await supabase
        .from('usuarios')
        .delete()
        .eq('uid', usuario.uid);

      if (dbError) throw dbError;

      setSuccess(`Usuário "${usuario.nome_completo}" excluído com sucesso!`);
      await loadUsuariosPendentes(); // Recarregar a lista

    } catch (err) {
      setError('Erro ao excluir usuário: ' + err.message);
      console.error('Erro detalhado:', err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // 6. FUNÇÕES: MODAL DE DETALHES DA LOJA
  // ============================================================================
  
  const handleOpenModal = (loja) => {
    setSelectedLoja(loja);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLoja(null);
  };

  const handleLojaUpdate = () => {
    setSuccess('Loja atualizada com sucesso!');
    loadLojas();
  };

  // ============================================================================
  // 7. VERIFICAÇÕES DE ACESSO E LOADING
  // ============================================================================
  if (userLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // ============================================================================
  // 8. RENDERIZAÇÃO PRINCIPAL
  // ============================================================================
  return (
    <RouteGuard requiredRole="admin">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Painel Administrativo</h1>
        
        {/* Mensagens de status */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Navegação por abas */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {['lojas', 'usuarios', 'associacoes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'lojas' && 'Lojas'}
                {tab === 'usuarios' && 'Usuários Pendentes'}
                {tab === 'associacoes' && 'Associações'}
              </button>
            ))}
          </nav>
        </div>

        {/* Conteúdo das abas */}
        <div className="mt-6">
          
          {/* ABA: LOJAS */}
          {activeTab === 'lojas' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Gerenciar Lojas</h2>
              
              {/* Formulário de criação de loja */}
              <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <h3 className="text-lg font-medium mb-3">Criar Nova Loja</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  handleCriarLoja({
                    id_loja: formData.get('id_loja'),
                    loja_nome: formData.get('loja_nome'),
                    loja_endereco: formData.get('loja_endereco'),
                    loja_telefone: formData.get('loja_telefone'),
                    loja_perimetro_entrega: formData.get('loja_perimetro_entrega'),
                    cnpj: formData.get('cnpj'),
                    loja_logo: formData.get('loja_logo')
                  });
                }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <input name="id_loja" placeholder="ID da Loja (ex: L1)" required className="w-full px-3 py-2 border border-gray-300 rounded" />
                    <input name="loja_nome" placeholder="Nome da Loja" required className="w-full px-3 py-2 border border-gray-300 rounded" />
                    <input name="loja_endereco" placeholder="Endereço" className="w-full px-3 py-2 border border-gray-300 rounded" />
                    <input name="loja_telefone" placeholder="Telefone" className="w-full px-3 py-2 border border-gray-300 rounded" />
                    <input name="loja_perimetro_entrega" placeholder="Perímetro de Entrega" className="w-full px-3 py-2 border border-gray-300 rounded" />
                    <input name="cnpj" placeholder="CNPJ" className="w-full px-3 py-2 border border-gray-300 rounded" />
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Logo da Loja (opcional)
                      </label>
                      <input 
                        type="file" 
                        name="loja_logo"
                        accept="image/*"
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Formatos: JPG, PNG, GIF. Máximo: 5MB
                      </p>
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                  >
                    {loading ? 'Criando...' : 'Criar Loja'}
                  </button>
                </form>
              </div>

              {/* Lista simplificada de lojas */}
              <div>
                <h3 className="text-lg font-medium mb-3">Lojas Cadastradas ({lojas.length})</h3>
                {loading ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md">
                    <div className="grid grid-cols-1 divide-y">
                      {lojas.map(loja => (
                        <div key={loja.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className={`w-3 h-3 rounded-full ${
                                loja.ativa ? 'bg-green-500' : 'bg-red-500'
                              }`}></span>
                              <button
                                onClick={() => handleOpenModal(loja)}
                                className="text-left text-blue-600 hover:text-blue-800 hover:underline font-medium"
                              >
                                {loja.loja_nome} ({loja.id_loja})
                              </button>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${
                              loja.ativa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {loja.ativa ? 'Ativa' : 'Inativa'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA: USUÁRIOS PENDENTES */}
          {activeTab === 'usuarios' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Usuários Pendentes ({usuariosPendentes.length})</h2>
              {loading ? (
                <div className="text-center py-4">Carregando...</div>
              ) : (
                <div className="grid gap-4">
                  {usuariosPendentes.map(usuario => (
                    <div key={usuario.uid} className="bg-white p-4 rounded-lg shadow-md">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-lg">{usuario.nome_completo}</h4>
                          <p className="text-gray-600">{usuario.email}</p>
                          <p className="text-gray-600">{usuario.telefone}</p>
                          <p className="text-sm text-gray-500">UID: {usuario.uid}</p>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => {
                              const lojaId = prompt('Digite o ID da loja para associar (ex: L1):');
                              if (lojaId) handleAssociarGerente(usuario.uid, lojaId);
                            }}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                            title="Associar este usuário como gerente de uma loja"
                          >
                            Associar como Gerente
                          </button>
                          <button
                            onClick={() => handleExcluirUsuario(usuario)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                            title="Excluir este usuário do sistema"
                            disabled={loading}
                          >
                            {loading ? 'Excluindo...' : 'Excluir Usuário'}
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        Cadastrado em: {new Date(usuario.data_cadastro).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABA: ASSOCIAÇÕES */}
          {activeTab === 'associacoes' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Associações Ativas</h2>
              {loading ? (
                <div className="text-center py-4">Carregando...</div>
              ) : (
                <div className="grid gap-4">
                  {associacoes.map(associacao => (
                    <div key={associacao.id} className="bg-white p-4 rounded-lg shadow-md">
                      <h4 className="font-semibold">{associacao.nome_completo}</h4>
                      <p className="text-gray-600">Função: {associacao.funcao}</p>
                      <p className="text-gray-600">Loja: {associacao.loja_nome}</p>
                      <p className="text-gray-600">Status: {associacao.status_vinculacao}</p>
                      <p className="text-gray-600 text-sm">
                        Última atualização: {new Date(associacao.ultimo_status_vinculacao).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal de detalhes da loja */}
        <DetalheLojaModal
          loja={selectedLoja}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onUpdate={handleLojaUpdate}
        />
      </div>
    </RouteGuard>
  );
}