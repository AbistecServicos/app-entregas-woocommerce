import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import { OrderModal, WithoutCourier } from '../components/OrderModal';

// ==============================================================================
// COMPONENTE PRINCIPAL - PEDIDOS PENDENTES
// ==============================================================================
export default function PedidosPendentes() {
  // ============================================================================
  // 1. ESTADOS DO COMPONENTE
  // ============================================================================
  const [pedidos, setPedidos] = useState([]);           // Lista de pedidos
  const [loading, setLoading] = useState(true);         // Estado de carregamento
  const [loadingAceitar, setLoadingAceitar] = useState(false); // Loading do botão Aceitar
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null); // Pedido para modal
  const [modalAberto, setModalAberto] = useState(false); // Controle do modal
  const router = useRouter();                           // Router do Next.js

  // ============================================================================
  // 2. EFFECT PARA CARREGAMENTO INICIAL
  // ============================================================================
  useEffect(() => {
    checkAuthAndGetPedidos();
  }, []); // [] = executa apenas uma vez ao montar o componente

  // ============================================================================
  // 3. FUNÇÃO: VERIFICAR AUTENTICAÇÃO + BUSCAR PEDIDOS
  // ============================================================================
  const checkAuthAndGetPedidos = async () => {
    try {
      // Verifica se usuário está logado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('Usuário não autenticado, redirecionando...');
        router.push('/login');
        return;
      }

      // Se autenticado, busca os pedidos
      await getPedidosPendentes(user.id);
      
    } catch (error) {
      console.error('Erro na autenticação:', error);
      router.push('/login');
    }
  };

  // ============================================================================
  // 4. FUNÇÃO: BUSCAR PEDIDOS PENDENTES DO BANCO
  // ============================================================================
  const getPedidosPendentes = async (userId) => {
    try {
      setLoading(true); // Inicia loading
      
      // Busca pedidos com status 'aguardando' ou 'revertido'
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .in('status_transporte', ['aguardando', 'revertido'])
        .order('data', { ascending: false }); // Mais recentes primeiro

      if (error) {
        throw new Error(`Erro no Supabase: ${error.message}`);
      }

      // Atualiza estado com os pedidos
      setPedidos(data || []);
      
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      alert('Erro ao carregar pedidos. Verifique o console.');
    } finally {
      setLoading(false); // Finaliza loading (sucesso ou erro)
    }
  };

  // ============================================================================
  // 5. FUNÇÃO: ACEITAR PEDIDO (BOTÃO PRINCIPAL)
  // ============================================================================
  const handleAceitarPedido = async (pedidoId) => {
    try {
      setLoadingAceitar(true); // Inicia loading do botão
      
      // 1. Verifica se usuário ainda está autenticado
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        alert('Sessão expirada. Faça login novamente.');
        router.push('/login');
        return;
      }

      // 2. Chama a Edge Function para aceitar o pedido
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/AceitarPedido`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ pedido_id: pedidoId })
        }
      );

      // 3. Verifica se a resposta foi bem-sucedida
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao aceitar pedido');
      }

      // 4. Atualiza a lista local (remove o pedido aceito)
      setPedidos(pedidos.filter(pedido => pedido.id !== pedidoId));
      
      // 5. Feedback para o usuário
      alert('✅ Pedido aceito com sucesso!');

    } catch (error) {
      console.error('Erro ao aceitar pedido:', error);
      alert(`❌ ${error.message}`);
    } finally {
      setLoadingAceitar(false); // Finaliza loading do botão
    }
  };

  // ============================================================================
  // 6. FUNÇÕES: CONTROLE DO MODAL DE DETALHES
  // ============================================================================
  const abrirModalDetalhes = (pedido) => {
    setPedidoSelecionado(pedido); // Define pedido para mostrar no modal
    setModalAberto(true);         // Abre o modal
  };

  const fecharModal = () => {
    setModalAberto(false);        // Fecha o modal
    setPedidoSelecionado(null);   // Limpa pedido selecionado
  };

  // ============================================================================
  // 7. RENDERIZAÇÃO DO COMPONENTE
  // ============================================================================
  return (
    <div className="container mx-auto px-4 py-8">
      {/* TÍTULO DA PÁGINA */}
      <h1 className="text-2xl font-bold text-purple-800 mb-6">📋 Pedidos Pendentes</h1>
      
      {/* ESTADO DE CARREGAMENTO */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-purple-600">Carregando pedidos...</p>
        </div>
      ) : (
        /* LISTA DE PEDIDOS */
        <div className="grid gap-4">
          {pedidos.length === 0 ? (
            // SEM PEDIDOS
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum pedido pendente encontrado.</p>
            </div>
          ) : (
            // COM PEDIDOS - MAPEA CADA PEDIDO
            pedidos.map(pedido => (
              <div key={pedido.id} className="bg-white p-4 rounded-lg shadow border">
                <div className="flex items-center justify-between">
                  
                  {/* INFORMAÇÕES DO PEDIDO (LADO ESQUERDO) */}
                  <div className="flex-1">
                    {/* BOTÃO PARA ABRIR MODAL */}
                    <button
                      onClick={() => abrirModalDetalhes(pedido)}
                      className="text-blue-600 hover:underline font-bold text-lg mb-1"
                    >
                      Pedido #{pedido.id_loja_woo}
                    </button>
                    
                    {/* INFORMAÇÕES BÁSICAS */}
                    <p className="text-sm text-gray-600 font-semibold">{pedido.loja_nome}</p>
                    <p className="text-sm"><span className="font-medium">Cliente:</span> {pedido.nome_cliente}</p>
                    <p className="text-sm"><span className="font-medium">Endereço:</span> {pedido.endereco_entrega}</p>
                    
                    {/* FRETE OFERECIDO (SE EXISTIR) */}
                    {pedido.frete_oferecido && (
                      <p className="text-sm text-green-600 font-medium mt-1">
                        💰 Frete oferecido: R$ {parseFloat(pedido.frete_oferecido).toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* BOTÃO ACEITAR (LADO DIREITO) */}
                  <button 
                    onClick={() => handleAceitarPedido(pedido.id)}
                    disabled={loadingAceitar}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 
                             transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed
                             ml-4 min-w-[80px]"
                  >
                    {loadingAceitar ? '⏳' : '✅'} Aceitar
                  </button>
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
        <WithoutCourier 
          pedido={pedidoSelecionado} 
          onClose={fecharModal} 
        />
      </OrderModal>
    </div>
  );
}