// ========================================
// PEDIDOS-PENDENTES.JS - PÁGINA CORRIGIDA
// ========================================
// Descrição: Lista pedidos pendentes com real-time (Supabase channels) e role-based actions.
// Problema resolvido: Duplicações em listeners/logs via useRef + condicionais dev.
// Manutenção: Seções numeradas para navegação (ex.: busque "SEÇÃO 5"). Remova console.logs em prod.
// Dependências: Next.js, Supabase, utils/notificationSender.
// ========================================

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import { OrderModal, WithoutCourier } from '../components/OrderModal';
import { notifyNewOrder } from '../utils/notificationSender';

// ==============================================================================
// COMPONENTE PRINCIPAL - PEDIDOS PENDENTES (CORRIGIDO)
// ==============================================================================
export default function PedidosPendentes() {
  // ============================================================================
  // 1. ESTADOS DO COMPONENTE (COM USER ROLE)
  // ============================================================================
  // Estados para UI e dados.
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAceitar, setLoadingAceitar] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [userRole, setUserRole] = useState('visitante'); // Role do usuário (determinado uma vez).
  const router = useRouter();

  // Ref para trackear subscription (evita múltiplos listeners).
  const subscriptionRef = useRef(null);
  const isDev = process.env.NODE_ENV === 'development'; // Flag para logs dev-only.

  // ============================================================================
  // 2. USEMEMO: DETERMINAR ROLE (COMPUTA UMA VEZ, ESTÁVEL)
  // ============================================================================
  // Memoiza role para evitar re-queries desnecessárias.
  const userRoleMemo = useMemo(() => {
    const determinarUserRole = async (userId) => {
      try {
        // 1. Verificar admin em 'usuarios'.
        const { data: usuarioData } = await supabase
          .from('usuarios')
          .select('is_admin')
          .eq('uid', userId)
          .single();

        if (usuarioData?.is_admin) {
          if (isDev) console.log('⚙️ Usuário é ADMIN');
          return 'admin';
        }

        // 2. Funções em 'loja_associada'.
        const { data: lojasData } = await supabase
          .from('loja_associada')
          .select('funcao')
          .eq('uid_usuario', userId)
          .eq('status_vinculacao', 'ativo');

        if (!lojasData || lojasData.length === 0) {
          if (isDev) console.log('👤 Usuário é VISITANTE');
          return 'visitante';
        }

        const funcoes = lojasData.map(loja => loja.funcao);
        
        if (funcoes.includes('gerente')) {
          if (isDev) console.log('💼 Usuário é GERENTE');
          return 'gerente';
        } else if (funcoes.includes('entregador')) {
          if (isDev) console.log('🚚 Usuário é ENTREGADOR');
          return 'entregador';
        } else {
          if (isDev) console.log('🔍 Usuário tem lojas mas sem função definida');
          return 'visitante';
        }
      } catch (error) {
        console.error('❌ Erro ao determinar role:', error);
        return 'visitante';
      }
    };

    return determinarUserRole;
  }, [isDev]); // Deps: só dev flag.

  // ============================================================================
  // 3. EFFECT PARA CARREGAMENTO INICIAL (AUTH + ROLE + PEDIDOS)
  // ============================================================================
  // Roda uma vez no mount: Auth → Role → Pedidos.
  useEffect(() => {
    const checkAuthAndGetPedidos = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          router.push('/login');
          return;
        }

        // Setar role (uma vez).
        const role = await userRoleMemo(user.id);
        setUserRole(role);
        
        // Buscar pedidos baseado em role.
        await getPedidosPendentes(role, user.id);
      } catch (error) {
        console.error('Erro na autenticação:', error);
        router.push('/login');
      }
    };

    checkAuthAndGetPedidos();
  }, [router, userRoleMemo]); // Deps: router (estável) + memo role.

  // ============================================================================
  // 4. USEEFFECT: ESCUTAR NOVOS PEDIDOS EM TEMPO REAL (COM CLEANUP)
  // ============================================================================
  // Setup listener após role setado; usa ref para evitar múltiplos.
  useEffect(() => {
    let mounted = true;

    const setupRealtimeListener = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || userRole === 'visitante') return;

        if (isDev) console.log('🔔 Configurando listener em tempo real...');

        // Cleanup anterior se existir.
        if (subscriptionRef.current) {
          supabase.removeChannel(subscriptionRef.current);
          if (isDev) console.log('🧹 Cleanup listener anterior');
        }

        // Buscar lojas do usuário.
        const { data: lojasUsuario } = await supabase
          .from('loja_associada')
          .select('id_loja')
          .eq('uid_usuario', user.id)
          .eq('status_vinculacao', 'ativo');

        if (!lojasUsuario || lojasUsuario.length === 0) return;

        const idsLojasUsuario = lojasUsuario.map(loja => loja.id_loja);

        // Novo subscription.
        const channel = supabase
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
              if (!mounted) return; // Evita updates pós-unmount.

              // Filtra por loja do usuário.
              if (idsLojasUsuario.includes(payload.new.id_loja)) {
                if (isDev) console.log('🎉 NOVO PEDIDO EM TEMPO REAL:', payload.new);
                
                // Notifica só entregadores (idempotente: cheque localStorage).
                if (userRole === 'entregador') {
                  const ultimoNotificado = localStorage.getItem(`ultimoPedidoNotificado_${user.id}`);
                  if (payload.new.id > (ultimoNotificado || 0)) {
                    await notifyNewOrder(
                      user.id,
                      payload.new.id,
                      payload.new.loja_nome
                    );
                    localStorage.setItem(`ultimoPedidoNotificado_${user.id}`, payload.new.id.toString());
                  }
                }
                
                // Atualiza lista (imutável).
                setPedidos(current => [payload.new, ...current]);
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED' && isDev) console.log('✅ Listener subscrito!');
          });

        subscriptionRef.current = channel; // Salva ref.

      } catch (error) {
        console.error('❌ Erro no listener:', error);
      }
    };

    if (userRole !== 'visitante') {
      setupRealtimeListener();
    }

    // Cleanup no unmount.
    return () => {
      mounted = false;
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
        if (isDev) console.log('🧹 Cleanup listener no unmount');
      }
    };
  }, [userRole]); // Deps: só role (muda uma vez).

  // ============================================================================
  // 5. USECALLBACK: BUSCAR PEDIDOS PENDENTES (MEMOIZADO)
  // ============================================================================
  // Função memoizada para evitar re-calls desnecessários.
  const getPedidosPendentes = useCallback(async (role, userId) => {
    try {
      setLoading(true);
      
      // Buscar lojas.
      const { data: lojasUsuario, error: errorLojas } = await supabase
        .from('loja_associada')
        .select('id_loja')
        .eq('uid_usuario', userId)
        .eq('status_vinculacao', 'ativo');

      if (errorLojas) {
        console.error('Erro ao buscar lojas do usuário:', errorLojas);
        return;
      }

      if (!lojasUsuario || lojasUsuario.length === 0) {
        setPedidos([]);
        return;
      }

      const idsLojasUsuario = lojasUsuario.map(loja => loja.id_loja);

      // Query pedidos filtrados.
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .in('status_transporte', ['aguardando', 'revertido'])
        .in('id_loja', idsLojasUsuario)
        .order('data', { ascending: false });

      if (error) throw error;
      setPedidos(data || []);

      // Notificação idempotente para entregadores (uma vez por load).
      if (data && data.length > 0 && role === 'entregador') {
        const ultimoNotificado = localStorage.getItem(`ultimoPedidoNotificado_${userId}`);
        const pedidosNovos = data.filter(pedido => 
          pedido.id > (ultimoNotificado || 0)
        );
        
        if (pedidosNovos.length > 0 && isDev) {
          console.log(`🔔 ${pedidosNovos.length} novo(s) pedido(s) encontrado(s)`);
        }
        
        // Notifica só o mais recente se novos.
        if (pedidosNovos.length > 0) {
          const pedidoMaisRecente = pedidosNovos[0];
          await notifyNewOrder(
            userId,
            pedidoMaisRecente.id,
            pedidoMaisRecente.loja_nome
          );
          localStorage.setItem(`ultimoPedidoNotificado_${userId}`, pedidoMaisRecente.id.toString());
        }
      }
      
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      alert('Erro ao carregar pedidos.');
    } finally {
      setLoading(false);
    }
  }, [isDev]); // Deps: só dev flag.

  // ============================================================================
  // 6. USECALLBACK: ACEITAR PEDIDO (APENAS ENTREGADORES)
  // ============================================================================
  // Memoizado para estabilidade.
  const handleAceitarPedido = useCallback(async (pedidoId) => {
    if (userRole !== 'entregador') {
      alert('❌ Apenas entregadores podem aceitar pedidos.');
      return;
    }

    try {
      setLoadingAceitar(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert('Sessão expirada. Faça login novamente.');
        router.push('/login');
        return;
      }

      // Buscar dados usuário/loja (otimizado: single query se possível).
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('telefone, nome_completo')
        .eq('uid', user.id)
        .single();

      if (usuarioError) console.warn('Erro ao buscar telefone do usuário:', usuarioError);

      const { data: entregadorData, error: entregadorError } = await supabase
        .from('loja_associada')
        .select('nome_completo, loja_telefone, loja_nome')
        .eq('uid_usuario', user.id)
        .limit(1);

      if (entregadorError) console.warn('Erro ao buscar dados da loja:', entregadorError);

      const entregador = entregadorData?.[0];
      const usuario = usuarioData;

      // Update pedido.
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
        .eq('id', pedidoId)
        .eq('status_transporte', 'aguardando'); // Otim lock: só se ainda pendente.

      if (updateError) throw new Error('Erro ao atualizar pedido: ' + updateError.message);

      // Atualiza local (remove da lista).
      setPedidos(current => current.filter(p => p.id !== pedidoId));
      alert('✅ Pedido aceito com sucesso!');

    } catch (error) {
      console.error('Erro ao aceitar pedido:', error);
      alert(`❌ ${error.message}`);
    } finally {
      setLoadingAceitar(false);
    }
  }, [userRole, router]); // Deps: role + router.

  // ============================================================================
  // 7. FUNÇÕES: CONTROLE DO MODAL (SIMPLE)
  // ============================================================================
  const abrirModalDetalhes = useCallback((pedido) => {
    setPedidoSelecionado(pedido);
    setModalAberto(true);
  }, []);

  const fecharModal = useCallback(() => {
    setModalAberto(false);
    setPedidoSelecionado(null);
  }, []);

  // ============================================================================
  // 8. RENDERIZAÇÃO DO COMPONENTE (OTIMIZADA)
  // ============================================================================
  // JSX com indicador dev e role-based UI.
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-purple-800 mb-6">📋 Pedidos Pendentes</h1>
      
      {/* Indicador dev (role + count). */}
      {isDev && (
        <div className="mb-4 p-2 bg-blue-100 text-blue-800 rounded text-sm">
          🔍 Modo: <strong>{userRole}</strong> | Pedidos: {pedidos.length}
        </div>
      )}
      
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

                  {/* Botão aceitar só para entregadores; indicador para outros. */}
                  {userRole === 'entregador' ? (
                    <button 
                      onClick={() => handleAceitarPedido(pedido.id)}
                      disabled={loadingAceitar}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 
                               transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed
                               ml-4 min-w-[80px]"
                    >
                      {loadingAceitar ? '⏳' : '✅'} Aceitar
                    </button>
                  ) : (
                    <div className="ml-4 text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded border">
                      <span className="font-medium block">
                        {userRole === 'admin' ? '👑 Admin' : '💼 Gerente'}
                      </span>
                      <span className="text-xs block mt-1">Apenas visualização</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de detalhes (com WithoutCourier). */}
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