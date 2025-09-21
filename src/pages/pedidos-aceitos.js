// pages/pedidos-aceitos.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import { useUserProfile } from '../hooks/useUserProfile';
import { filterPedidosPorUsuario } from '../utils/filterPedidos';
import { OrderModal, WithCourier } from '../components/OrderModal';

// ==============================================================================
// COMPONENTE PRINCIPAL - PEDIDOS ACEITOS
// ==============================================================================
export default function PedidosAceitos() {
  // ============================================================================
  // 1. ESTADOS DO COMPONENTE
  // ============================================================================
  const [todosPedidos, setTodosPedidos] = useState([]); // Todos os pedidos do banco
  const [loading, setLoading] = useState(true); // Estado de carregamento
  const [loadingAcoes, setLoadingAcoes] = useState(false); // Loading para ações
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null); // Pedido para modal
  const [modalAberto, setModalAberto] = useState(false); // Controle do modal
  
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
  // 3. FUNÇÃO: VERIFICAR AUTENTICAÇÃO + BUSCAR PEDIDOS
  // ============================================================================
  const checkAuthAndGetPedidos = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        router.push('/login');
        return;
      }

      await getPedidosAceitos();
    } catch (error) {
      console.error('Erro de autenticação:', error);
      router.push('/login');
    }
  };

  // ============================================================================
  // 4. FUNÇÃO: BUSCAR PEDIDOS ACEITOS/EM ROTA
  // ============================================================================
  const getPedidosAceitos = async () => {
    try {
      setLoading(true);
      
      // Busca TODOS os pedidos com status aceito ou em rota
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .in('status_transporte', ['aceito', 'em rota'])
        .order('data', { ascending: false });

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
  // 5. FILTRAR PEDIDOS POR USUÁRIO
  // ============================================================================
  const pedidosFiltrados = filterPedidosPorUsuario(
    todosPedidos,
    userRole, 
    userLojas
  );

  // ============================================================================
  // 6. FUNÇÕES DE AÇÃO: SAIR PARA ENTREGA / ENTREGAR / CANCELAR
  // ============================================================================
  const handleSairEntrega = async (pedidoId) => {
    try {
      setLoadingAcoes(true);
      
      const { error } = await supabase
        .from('pedidos')
        .update({ status_transporte: 'em rota' })
        .eq('id', pedidoId);

      if (error) throw error;
      
      // Atualiza lista localmente
      setTodosPedidos(prev => prev.map(p => 
        p.id === pedidoId ? { ...p, status_transporte: 'em rota' } : p
      ));
      
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao sair para entrega.');
    } finally {
      setLoadingAcoes(false);
    }
  };

  const handleEntregar = async (pedidoId) => {
    try {
      setLoadingAcoes(true);
      
      const { error } = await supabase
        .from('pedidos')
        .update({ status_transporte: 'entregue' })
        .eq('id', pedidoId);

      if (error) throw error;
      
      // Remove da lista (pedido entregue vai para outra página)
      setTodosPedidos(prev => prev.filter(p => p.id !== pedidoId));
      
      alert('Pedido marcado como entregue com sucesso!');
      
    } catch (error) {
      console.error('Erro ao entregar pedido:', error);
      alert('Erro ao marcar como entregue.');
    } finally {
      setLoadingAcoes(false);
    }
  };

  const handleCancelar = async (pedidoId) => {
    if (!confirm('Tem certeza que deseja cancelar esta entrega?')) return;
    
    try {
      setLoadingAcoes(true);
      
      const { error } = await supabase
        .from('pedidos')
        .update({ status_transporte: 'cancelado' })
        .eq('id', pedidoId);

      if (error) throw error;
      
      // Remove da lista
      setTodosPedidos(prev => prev.filter(p => p.id !== pedidoId));
      
      alert('Entrega cancelada com sucesso.');
      
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      alert('Erro ao cancelar entrega.');
    } finally {
      setLoadingAcoes(false);
    }
  };

  // ============================================================================
  // 7. FUNÇÕES: CONTROLE DO MODAL
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
  // 8. RENDERIZAÇÃO DO COMPONENTE
  // ============================================================================
  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* TÍTULO */}
      <h1 className="text-2xl font-bold text-purple-800 mb-6">✅ Pedidos Aceitos</h1>

      {/* ESTADO DE CARREGAMENTO */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-purple-600">Carregando pedidos...</p>
        </div>
      ) : (
        /* LISTA DE PEDIDOS */
        <div className="grid gap-4">
          {pedidosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum pedido aceito encontrado.</p>
            </div>
          ) : (
            pedidosFiltrados.map(pedido => (
              <div key={pedido.id} className="bg-white p-4 rounded-lg shadow border">
                <div className="flex items-center justify-between">
                  
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
                    <p className="text-sm"><span className="font-medium">Endereço:</span> {pedido.endereco_entrega}</p>

{/* FRETE OFERECIDO - ADICIONADO */}
{pedido.frete_oferecido && (
  <p className="text-sm text-green-600 font-medium mt-1">
    💰 Frete oferecido: R$ {parseFloat(pedido.frete_oferecido).toFixed(2)}
  </p>
)}

<p className="text-sm">
  <span className="font-medium">Status:</span> 
  <span className={pedido.status_transporte === 'em rota' ? 'text-orange-600' : 'text-green-600'}>
    {pedido.status_transporte === 'em rota' ? ' 🚚 Em Rota' : ' ✅ Aceito'}
  </span>
</p>
                  </div>

                  {/* BOTÕES DE AÇÃO */}
                  <div className="flex flex-col gap-2 ml-4">
                    {pedido.status_transporte === 'aceito' && (
                      <button 
                        onClick={() => handleSairEntrega(pedido.id)}
                        disabled={loadingAcoes}
                        className="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600 transition-colors"
                      >
                        🚚 Sair para Entrega
                      </button>
                    )}
                    
                    {pedido.status_transporte === 'em rota' && (
                      <button 
                        onClick={() => handleEntregar(pedido.id)}
                        disabled={loadingAcoes}
                        className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600 transition-colors"
                      >
                        ✅ Entregar
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleCancelar(pedido.id)}
                      disabled={loadingAcoes}
                      className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600 transition-colors"
                    >
                      ❌ Cancelar
                    </button>
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
        <WithCourier 
          pedido={pedidoSelecionado} 
          onClose={fecharModal} 
        />
      </OrderModal>
    </div>
  );
}