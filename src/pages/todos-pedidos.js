// pages/todos-pedidos.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import { useUserProfile } from '../hooks/useUserProfile';
import { OrderModal, WithCourier, WithoutCourier } from '../components/OrderModal';

// ==============================================================================
// COMPONENTE PRINCIPAL - TODOS OS PEDIDOS
// ==============================================================================
export default function TodosPedidos() {
  // ============================================================================
  // 1. ESTADOS DO COMPONENTE
  // ============================================================================
  const [todosPedidos, setTodosPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  
  // Estados para filtros
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroEntregador, setFiltroEntregador] = useState('');
  const [filtroLoja, setFiltroLoja] = useState('');
  const [editandoFrete, setEditandoFrete] = useState(null);
  const [valorFrete, setValorFrete] = useState('');

  const router = useRouter();
  const { userRole, userLojas, loading: loadingUser } = useUserProfile();

  // ============================================================================
  // 2. EFFECT PARA CARREGAMENTO INICIAL
  // ============================================================================
  useEffect(() => {
    if (!loadingUser) {
      checkAuthAndGetPedidos();
    }
  }, [loadingUser]);

  // ============================================================================
  // 3. VERIFICAÇÃO DE PERMISSÕES
  // ============================================================================
  useEffect(() => {
    if (!loadingUser && userRole !== 'admin' && userRole !== 'gerente') {
      alert('Acesso restrito a gerentes e administradores');
      router.push('/pedidos-pendentes');
    }
  }, [loadingUser, userRole, router]);

  // ============================================================================
  // 4. FUNÇÃO: VERIFICAR AUTENTICAÇÃO + BUSCAR PEDIDOS
  // ============================================================================
  const checkAuthAndGetPedidos = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        router.push('/login');
        return;
      }

      await getTodosPedidos();
    } catch (error) {
      console.error('Erro de autenticação:', error);
      router.push('/login');
    }
  };

  // ============================================================================
  // 5. FUNÇÃO: BUSCAR TODOS OS PEDIDOS
  // ============================================================================
  const getTodosPedidos = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('pedidos')
        .select('*')
        .order('data', { ascending: false });

      // Se for gerente, filtrar apenas pela sua loja
      if (userRole === 'gerente' && userLojas.length > 0) {
        query = query.eq('id_loja', userLojas[0].id_loja);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setTodosPedidos(data || []);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      alert('Erro ao carregar pedidos. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // 6. FUNÇÃO: FILTRAR PEDIDOS
  // ============================================================================
  const pedidosFiltrados = todosPedidos.filter(pedido => {
    // Filtro por status
    if (filtroStatus && pedido.status_transporte !== filtroStatus) {
      return false;
    }
    
    // Filtro por entregador
    if (filtroEntregador && pedido.aceito_por_nome !== filtroEntregador) {
      return false;
    }
    
    // Filtro por loja (apenas para admin)
    if (userRole === 'admin' && filtroLoja && pedido.id_loja !== filtroLoja) {
      return false;
    }
    
    return true;
  });

  // ============================================================================
  // 7. FUNÇÃO: REVERTER PEDIDO (BOTÃO GERENTE/ADMIN)
  // ============================================================================
  const handleReverterPedido = async (pedidoId) => {
    if (!confirm('Tem certeza que deseja reverter este pedido?')) return;
    
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({
          status_transporte: 'revertido',
          aceito_por_uid: null,
          aceito_por_nome: null,
          aceito_por_email: null,
          aceito_por_telefone: null,
          ultimo_status: new Date().toISOString()
        })
        .eq('id', pedidoId);

      if (error) throw error;

      // Atualizar lista localmente
      setTodosPedidos(prev => prev.map(p => 
        p.id === pedidoId ? { 
          ...p, 
          status_transporte: 'revertido',
          aceito_por_uid: null,
          aceito_por_nome: null,
          aceito_por_email: null,
          aceito_por_telefone: null
        } : p
      ));
      
      alert('✅ Pedido revertido com sucesso!');
    } catch (error) {
      console.error('Erro ao reverter pedido:', error);
      alert('❌ Erro ao reverter pedido.');
    }
  };

  // ============================================================================
  // 8. FUNÇÃO: EDITAR FRETE OFERECIDO
  // ============================================================================
  const handleEditarFrete = (pedido, valor) => {
    setEditandoFrete(pedido.id);
    setValorFrete(valor || '');
  };

  const handleSalvarFrete = async (pedidoId) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ 
          frete_oferecido: parseFloat(valorFrete) || null,
          ultimo_status: new Date().toISOString()
        })
        .eq('id', pedidoId);

      if (error) throw error;

      // Atualizar lista localmente
      setTodosPedidos(prev => prev.map(p => 
        p.id === pedidoId ? { ...p, frete_oferecido: parseFloat(valorFrete) || null } : p
      ));
      
      setEditandoFrete(null);
      alert('✅ Frete atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar frete:', error);
      alert('❌ Erro ao atualizar frete.');
    }
  };

  // ============================================================================
  // 9. FUNÇÕES: CONTROLE DO MODAL
  // ============================================================================
  const abrirModalDetalhes = (pedido) => {
    setPedidoSelecionado(pedido);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setPedidoSelecionado(null);
  };

  // ============================================================================
  // 10. DADOS PARA FILTROS
  // ============================================================================
  const statusUnicos = [...new Set(todosPedidos.map(p => p.status_transporte))].filter(Boolean);
  const entregadoresUnicos = [...new Set(todosPedidos.map(p => p.aceito_por_nome))].filter(Boolean);
  const lojasUnicas = [...new Set(todosPedidos.map(p => p.id_loja))].filter(Boolean);

  // ============================================================================
  // 11. RENDERIZAÇÃO DO COMPONENTE
  // ============================================================================
  if (loadingUser) {
    return <div className="min-h-screen flex items-center justify-center">Carregando perfil...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* TÍTULO */}
      <h1 className="text-2xl font-bold text-purple-800 mb-6">📊 Todos os Pedidos</h1>

      {/* FILTROS */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro Status */}
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">Todos os status</option>
              {statusUnicos.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Filtro Entregador */}
          <div>
            <label className="block text-sm font-medium mb-1">Entregador</label>
            <select
              value={filtroEntregador}
              onChange={(e) => setFiltroEntregador(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">Todos os entregadores</option>
              {entregadoresUnicos.map(entregador => (
                <option key={entregador} value={entregador}>{entregador}</option>
              ))}
            </select>
          </div>

          {/* Filtro Loja (apenas admin) */}
          {userRole === 'admin' && (
            <div>
              <label className="block text-sm font-medium mb-1">Loja</label>
              <select
                value={filtroLoja}
                onChange={(e) => setFiltroLoja(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">Todas as lojas</option>
                {lojasUnicas.map(loja => (
                  <option key={loja} value={loja}>{loja}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* LISTA DE PEDIDOS */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-purple-600">Carregando pedidos...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pedidosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum pedido encontrado.</p>
            </div>
          ) : (
            pedidosFiltrados.map(pedido => (
              <div key={pedido.id} className="bg-white p-4 rounded-lg shadow border">
                <div className="flex items-start justify-between">
                  
                  {/* INFORMAÇÕES DO PEDIDO */}
                  <div className="flex-1">
                    <button
                      onClick={() => abrirModalDetalhes(pedido)}
                      className="text-blue-600 hover:underline font-bold text-lg mb-1"
                    >
                      Pedido #{pedido.id_loja_woo}
                    </button>
                    
                    <p className="text-sm text-gray-600 font-semibold">{pedido.loja_nome}</p>
                    <p className="text-sm"><span className="font-medium">Cliente:</span> {pedido.nome_cliente}</p>
                    <p className="text-sm"><span className="font-medium">Status:</span> 
                      <span className={`ml-1 ${
                        pedido.status_transporte === 'entregue' ? 'text-green-600' :
                        pedido.status_transporte === 'cancelado' ? 'text-red-600' :
                        pedido.status_transporte === 'em rota' ? 'text-orange-600' : 'text-blue-600'
                      }`}>
                        {pedido.status_transporte}
                      </span>
                    </p>
                    
                    {pedido.aceito_por_nome && (
                      <p className="text-sm"><span className="font-medium">Entregador:</span> {pedido.aceito_por_nome}</p>
                    )}

                    {/* EDIÇÃO DE FRETE */}
                    <div className="mt-2">
                      <span className="text-sm font-medium">Frete oferecido: </span>
                      {editandoFrete === pedido.id ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="number"
                            step="0.01"
                            value={valorFrete}
                            onChange={(e) => setValorFrete(e.target.value)}
                            className="w-20 p-1 border border-gray-300 rounded"
                            placeholder="0.00"
                          />
                          <button
                            onClick={() => handleSalvarFrete(pedido.id)}
                            className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                          >
                            ✅
                          </button>
                          <button
                            onClick={() => setEditandoFrete(null)}
                            className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
                          >
                            ❌
                          </button>
                        </div>
                      ) : (
                        <span className="text-green-600">
                          R$ {pedido.frete_oferecido?.toFixed(2) || '0.00'} 
                          <button
                            onClick={() => handleEditarFrete(pedido, pedido.frete_oferecido)}
                            className="ml-2 text-blue-600 text-sm"
                          >
                            ✏️
                          </button>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* BOTÕES DE AÇÃO (GERENTE/ADMIN) */}
                  <div className="flex flex-col gap-2 ml-4">
                    {/* BOTÃO REVERTER (para pedidos aceitos/em rota) */}
                    {['aceito', 'em rota'].includes(pedido.status_transporte) && (
                      <button 
                        onClick={() => handleReverterPedido(pedido.id)}
                        className="bg-yellow-500 text-white px-4 py-2 rounded text-sm hover:bg-yellow-600"
                      >
                        ↩️ Reverter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL DE DETALHES */}
      <OrderModal 
        pedido={pedidoSelecionado} 
        isOpen={modalAberto} 
        onClose={fecharModal}
      >
        {pedidoSelecionado?.aceito_por_nome ? (
          <WithCourier pedido={pedidoSelecionado} onClose={fecharModal} />
        ) : (
          <WithoutCourier pedido={pedidoSelecionado} onClose={fecharModal} />
        )}
      </OrderModal>
    </div>
  );
}