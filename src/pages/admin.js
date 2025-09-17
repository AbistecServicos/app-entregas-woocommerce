// pages/admin.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';
import RouteGuard from '../components/RouteGuard';

// ==============================================================================
// PÁGINA DE ADMINISTRAÇÃO
// ==============================================================================
/**
 * Painel administrativo para gerenciamento do sistema
 * Acessível apenas para usuários com role 'admin'
 * 
 * IMPORTANTE: Esta página NÃO usa o Layout padrão (já é aplicado pelo _app.js)
 * Por isso NÃO devemos envolver com <Layout> aqui
 */
export default function Admin() {
  // ============================================================================
  // 1. ESTADOS E HOOKS
  // ============================================================================
  const { userRole, loading: userLoading } = useUserProfile();
  const [activeTab, setActiveTab] = useState('lojas');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
  /**
   * Carrega lista de lojas cadastradas
   */
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

  /**
   * Carrega usuários não vinculados a lojas (pendentes)
   */
  const loadUsuariosPendentes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .not('uid', 'in', 
          `(select uid_usuario from loja_associada where status_vinculacao = 'ativo')`
        );
      
      if (error) throw error;
      setUsuariosPendentes(data || []);
    } catch (err) {
      setError('Erro ao carregar usuários: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carrega associações ativas entre usuários e lojas
   */
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
  /**
   * Cria uma nova loja no sistema
   */
  const handleCriarLoja = async (dadosLoja) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('lojas')
        .insert([{
          id_loja: dadosLoja.id_loja,
          loja_nome: dadosLoja.loja_nome,
          loja_endereco: dadosLoja.loja_endereco,
          loja_telefone: dadosLoja.loja_telefone,
          loja_perimetro_entrega: dadosLoja.loja_perimetro_entrega,
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

  /**
   * Associa um usuário como gerente de uma loja
   */
  const handleAssociarGerente = async (usuarioId, lojaId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar dados do usuário e loja em paralelo
      const [{ data: usuario }, { data: loja }] = await Promise.all([
        supabase.from('usuarios').select('*').eq('uid', usuarioId).single(),
        supabase.from('lojas').select('*').eq('id_loja', lojaId).single()
      ]);
      
      if (!usuario || !loja) throw new Error('Usuário ou loja não encontrados');
      
      // Criar associação
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
  // 5. VERIFICAÇÕES DE ACESSO E LOADING
  // ============================================================================
  if (userLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // ============================================================================
  // 6. RENDERIZAÇÃO PRINCIPAL
  // ============================================================================
  return (
    <RouteGuard requiredRole="admin">
      {/* ✅ REMOVIDO: <Layout> wrapper (já é aplicado pelo _app.js) */}
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
          {/* Aba: Lojas */}
          {activeTab === 'lojas' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Gerenciar Lojas</h2>
              
              {/* Formulário de criação */}
              <div className="bg-white p-4 rounded-lg shadow-md mb-4">
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
                    cnpj: formData.get('cnpj')
                  });
                }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <input name="id_loja" placeholder="ID da Loja (ex: L1)" required />
                    <input name="loja_nome" placeholder="Nome da Loja" required />
                    <input name="loja_endereco" placeholder="Endereço" />
                    <input name="loja_telefone" placeholder="Telefone" />
                    <input name="loja_perimetro_entrega" placeholder="Perímetro de Entrega" />
                    <input name="cnpj" placeholder="CNPJ" />
                  </div>
                  <button type="submit" disabled={loading}>
                    {loading ? 'Criando...' : 'Criar Loja'}
                  </button>
                </form>
              </div>

              {/* Listagem de lojas */}
              <div>
                <h3 className="text-lg font-medium mb-3">Lojas Cadastradas</h3>
                {loading ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : (
                  <div className="grid gap-4">
                    {lojas.map(loja => (
                      <div key={loja.id} className="bg-white p-4 rounded-lg shadow-md">
                        <h4 className="font-semibold">{loja.loja_nome} ({loja.id_loja})</h4>
                        <p className="text-gray-600">{loja.loja_endereco}</p>
                        <p className="text-gray-600">{loja.loja_telefone}</p>
                        <p className="text-gray-600">Perímetro: {loja.loja_perimetro_entrega}</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs ${
                          loja.ativa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {loja.ativa ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Aba: Usuários Pendentes */}
          {activeTab === 'usuarios' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Usuários Pendentes</h2>
              {loading ? (
                <div className="text-center py-4">Carregando...</div>
              ) : (
                <div className="grid gap-4">
                  {usuariosPendentes.map(usuario => (
                    <div key={usuario.uid} className="bg-white p-4 rounded-lg shadow-md">
                      <h4 className="font-semibold">{usuario.nome_completo}</h4>
                      <p className="text-gray-600">{usuario.email}</p>
                      <p className="text-gray-600">{usuario.telefone}</p>
                      <button
                        onClick={() => {
                          const lojaId = prompt('Digite o ID da loja para associar (ex: L1):');
                          if (lojaId) handleAssociarGerente(usuario.uid, lojaId);
                        }}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm mt-2"
                      >
                        Associar como Gerente
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Aba: Associações */}
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
      </div>
    </RouteGuard>
  );
}

// ==============================================================================
// MARCAÇÃO: ESTA PÁGINA NÃO USA LAYOUT PADRÃO (já é aplicado pelo _app.js)
// ==============================================================================
