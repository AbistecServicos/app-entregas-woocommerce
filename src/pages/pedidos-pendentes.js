import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import { OrderModal, WithoutCourier } from '../components/OrderModal';
import { notifyNewOrder } from '../utils/notificationSender';

// ==============================================================================
// COMPONENTE PRINCIPAL - PEDIDOS PENDENTES
// ==============================================================================
export default function PedidosPendentes() {
  // ============================================================================
  // 1. ESTADOS DO COMPONENTE
  // ============================================================================
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAceitar, setLoadingAceitar] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const router = useRouter();

  // ============================================================================
  // 2. EFFECT PARA CARREGAMENTO INICIAL
  // ============================================================================
  useEffect(() => {
    checkAuthAndGetPedidos();
  }, []);

  // ============================================================================
  // 2.1 EFFECT: ESCUTAR NOVOS PEDIDOS EM TEMPO REAL
  // ============================================================================
  useEffect(() => {
    const setupRealtimeListener = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log('🔔 Configurando listener em tempo real...');

        // Buscar as lojas do entregador
        const { data: lojasEntregador } = await supabase
          .from('loja_associada')
          .select('id_loja')
          .eq('uid_usuario', user.id)
          .eq('status_vinculacao', 'ativo');

        if (!lojasEntregador || lojasEntregador.length === 0) return;

        const idsLojasEntregador = lojasEntregador.map(loja => loja.id_loja);

        // Configurar subscription
        const subscription = supabase
          .channel('pedidos-pendentes-realtime')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'pedidos',
              filter: `status_transporte=in.(aguardando,revertido)`
            },
            async (payload) => {
              // Verificar se o pedido é das lojas do entregador
              if (idsLojasEntregador.includes(payload.new.id_loja)) {
                console.log('🎉 NOVO PEDIDO EM TEMPO REAL:', payload.new);
                
                // 🚀 NOTIFICAR O ENTREGADOR ATUAL
                await notifyNewOrder(
                  user.id,
                  payload.new.id,
                  payload.new.loja_nome
                );
                
                // Atualizar lista
                setPedidos(current => [payload.new, ...current]);
              }
            }
          )
          .subscribe();

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('❌ Erro no listener:', error);
      }
    };

    setupRealtimeListener();
  }, []);

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
      await getPedidosPendentes();
    } catch (error) {
      console.error('Erro na autenticação:', error);
      router.push('/login');
    }
  };

  // ============================================================================
  // 4. FUNÇÃO: BUSCAR PEDIDOS PENDENTES
  // ============================================================================
  const getPedidosPendentes = async () => {
    try {
      setLoading(true);
      
      // 1. Buscar as lojas do entregador autenticado
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: lojasEntregador, error: errorLojas } = await supabase
        .from('loja_associada')
        .select('id_loja')
        .eq('uid_usuario', user.id)
        .eq('status_vinculacao', 'ativo');

      if (errorLojas) {
        console.error('Erro ao buscar lojas do entregador:', errorLojas);
        return;
      }

      // 2. Se não tiver lojas, não mostra nenhum pedido
      if (!lojasEntregador || lojasEntregador.length === 0) {
        setPedidos([]);
        return;
      }

      // 3. Extrair IDs das lojas
      const idsLojasEntregador = lojasEntregador.map(loja => loja.id_loja);

      // 4. Buscar pedidos APENAS das lojas do entregador
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .in('status_transporte', ['aguardando', 'revertido'])
        .in('id_loja', idsLojasEntregador)
        .order('data', { ascending: false });

      if (error) throw error;
      setPedidos(data || []);
      
      // 🎯 NOTIFICAÇÃO PARA PEDIDOS NOVOS
      if (data && data.length > 0) {
        const ultimoPedidoNotificado = localStorage.getItem('ultimoPedidoNotificado');
        const pedidosNovos = data.filter(pedido => 
          pedido.id > (ultimoPedidoNotificado || 0)
        );
        
        if (pedidosNovos.length > 0) {
          console.log(`🔔 ${pedidosNovos.length} novo(s) pedido(s) encontrado(s)`);
          const pedidoMaisRecente = pedidosNovos[0];
          
          // 🚀 NOTIFICAR O ENTREGADOR ATUAL
          await notifyNewOrder(
            user.id,
            pedidoMaisRecente.id,
            pedidoMaisRecente.loja_nome
          );
          
          localStorage.setItem('ultimoPedidoNotificado', pedidoMaisRecente.id);
        }
      }
      
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      alert('Erro ao carregar pedidos.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // 5. FUNÇÃO: ACEITAR PEDIDO
  // ============================================================================
  const handleAceitarPedido = async (pedidoId) => {
    try {
      setLoadingAceitar(true);
      
      // 1. Verificar se usuário está autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert('Sessão expirada. Faça login novamente.');
        router.push('/login');
        return;
      }

      // 2. Buscar telefone do usuário
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('telefone, nome_completo')
        .eq('uid', user.id)
        .single();

      if (usuarioError) {
        console.warn('Erro ao buscar telefone do usuário:', usuarioError);
      }

      // 3. Buscar dados da loja associada
      const { data: entregadorData, error: entregadorError } = await supabase
        .from('loja_associada')
        .select('nome_completo, loja_telefone, loja_nome')
        .eq('uid_usuario', user.id)
        .limit(1);

      if (entregadorError) {
        console.warn('Erro ao buscar dados da loja:', entregadorError);
      }

      const entregador = entregadorData?.[0];
      const usuario = usuarioData;

      // 4. Atualizar pedido
      const { error: updateError } = await supabase
        .from('pedidos')
        .update({
          status_transporte: 'aceito',
          aceito_por_uid: user.id,
          aceito_por_nome: entregador?.nome_completo || usuario?.nome_completo || user.email,
          aceito_por_email: user.email,
          aceito_por_telefone: usuario?.telefone || entregador?.loja_telefone || 'Não informado',
          ultimo_status: new Date().toISOString()
        })
        .eq('id', pedidoId);

      if (updateError) {
        throw new Error('Erro ao atualizar pedido: ' + updateError.message);
      }

      // 5. Atualizar lista localmente
      setPedidos(pedidos.filter(pedido => pedido.id !== pedidoId));
      alert('✅ Pedido aceito com sucesso!');

    } catch (error) {
      console.error('Erro ao aceitar pedido:', error);
      alert(`❌ ${error.message}`);
    } finally {
      setLoadingAceitar(false);
    }
  };

  // ============================================================================
  // 6. FUNÇÕES: CONTROLE DO MODAL
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
  // 7. RENDERIZAÇÃO DO COMPONENTE
  // ============================================================================
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-purple-800 mb-6">📋 Pedidos Pendentes</h1>
      
      {loading ? (
        <div className="text-center py-8">
          <p className="text-purple-600">Carregando pedidos...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pedidos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum pedido pendente encontrado.</p>
            </div>
          ) : (
            pedidos.map(pedido => (
              <div key={pedido.id} className="bg-white p-4 rounded-lg shadow border">
                <div className="flex items-center justify-between">
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
                    {pedido.frete_oferecido && (
                      <p className="text-sm text-green-600 font-medium mt-1">
                        💰 Frete oferecido: R$ {parseFloat(pedido.frete_oferecido).toFixed(2)}
                      </p>
                    )}
                  </div>

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
// 🎯 FIM DO COMPONENTE - ESTA CHAVE FECHA TUDO!