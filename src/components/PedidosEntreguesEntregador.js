// ============================================================================
// IMPORTAÇÕES
// ============================================================================
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { OrderModal, WithCourier } from './OrderModal';

// ============================================================================
// COMPONENTE: PEDIDOS ENTREGUES - ENTREGADOR
// ============================================================================
/**
 * Versão exclusiva para ENTREGADORES:
 * - Só pode visualizar seus próprios pedidos entregues.
 * - Pode filtrar por loja e status de pagamento.
 * - Não pode editar valores, nem atualizar, nem gerar recibos.
 */
export default function PedidosEntreguesEntregador({ userProfile }) {
  // ==========================================================================
  // 1. ESTADOS DO COMPONENTE
  // ==========================================================================
  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filtroLoja, setFiltroLoja] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [lojas, setLojas] = useState([]);
  const [error, setError] = useState(null); // Estado para erros

  // ==========================================================================
  // 2. CARREGAR LOJAS ASSOCIADAS AO ENTREGADOR
  // ==========================================================================
  useEffect(() => {
    const carregarLojas = async () => {
      if (!userProfile?.uid) {
        setError('Usuário não autenticado.');
        return;
      }

      try {
        console.log('🔍 Carregando lojas para UID:', userProfile.uid); // Log para depuração
        const { data, error } = await supabase
          .from('loja_associada')
          .select('id_loja, loja_nome')
          .eq('uid_usuario', userProfile.uid); // ✅ Corrigido: 'uid_usuario'

        if (error) throw error;
        console.log('✅ Lojas carregadas:', data); // Log para depuração
        
        // Processar para uniques por id_loja
        const uniqueLojas = [...new Map(data.map(item => [item.id_loja, item])).values()];
        setLojas(uniqueLojas);
      } catch (err) {
        console.error('Erro ao carregar lojas do entregador:', err.message);
        setError('Falha ao carregar lojas associadas. Verifique o schema da tabela loja_associada.');
      }
    };

    carregarLojas();
  }, [userProfile]);

  // ==========================================================================
  // 3. CARREGAR PEDIDOS DO ENTREGADOR LOGADO
  // ==========================================================================
  const carregarPedidos = async () => {
    setIsLoading(true);
    try {
      if (!userProfile?.uid) {
        setError('Usuário não autenticado.');
        return;
      }

      console.log('🔍 Carregando pedidos para UID:', userProfile.uid); // Log para depuração
      let query = supabase
        .from('pedidos')
        .select('*')
        .eq('status_transporte', 'entregue')
        .eq('aceito_por_uid', userProfile.uid); // ✅ Corrigido: 'aceito_por_uid'

      if (filtroLoja) {
        query = query.eq('id_loja', filtroLoja);
      }
      if (filtroStatus) {
        query = query.eq('status_pagamento', filtroStatus === 'true');
      }

      const { data, error } = await query;
      if (error) throw error;

      console.log('✅ Pedidos carregados:', data); // Log para depuração
      setPedidos(data || []);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar pedidos do entregador:', err.message);
      setError('Falha ao carregar pedidos. Verifique o schema da tabela pedidos.');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================================
  // 4. ABRIR MODAL DE DETALHES
  // ==========================================================================
  const abrirModalDetalhes = (pedido) => {
    if (pedido) {
      setPedidoSelecionado(pedido);
      setModalAberto(true);
    }
  };

  // ==========================================================================
  // 5. USEEFFECT PARA CARREGAR PEDIDOS
  // ==========================================================================
  useEffect(() => {
    if (userProfile?.uid) carregarPedidos();
  }, [userProfile, filtroLoja, filtroStatus]);

  // ==========================================================================
  // 6. RENDERIZAÇÃO
  // ==========================================================================
  return (
    <div className="bg-gray-50 min-h-screen p-4">
      {/* Cabeçalho do entregador */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-4 sticky top-4 z-10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-purple-800">Meus Pedidos Entregues</h1>
            <p className="text-sm text-gray-600">
              Entregador: {userProfile.nome_completo || 'Não informado'}
            </p>
          </div>
        </div>

        {/* Filtros → Loja + Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          <select
            value={filtroLoja}
            onChange={(e) => setFiltroLoja(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">Todas Lojas</option>
            {lojas.map((loja) => (
              <option key={loja.id_loja} value={loja.id_loja}>
                {loja.loja_nome || `Loja ${loja.id_loja}`} {/* Fallback e desambiguação */}
              </option>
            ))}
          </select>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">Todos Status</option>
            <option value="true">Pago</option>
            <option value="false">Pendente</option>
          </select>
        </div>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      {/* Lista de pedidos (apenas visualização) */}
      <div className="container mx-auto px-2">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-purple-600">Carregando seus pedidos...</p>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-purple-600">Nenhum pedido entregue encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="bg-white rounded-lg shadow p-3">
                <button
                  onClick={() => abrirModalDetalhes(pedido)}
                  className="text-base font-bold text-purple-800 hover:text-purple-600 hover:underline w-full text-left"
                >
                  Pedido #{pedido.id_loja_woo}
                </button>
                <p className="text-sm font-semibold text-blue-800">{pedido.loja_nome}</p>
                <div className="mt-2 text-sm">
  <p>
    <strong>Data Entrega:</strong>{' '}
    {pedido.data ? new Date(pedido.data).toLocaleDateString('pt-BR') : '-'}
  </p>
  <p>
    <strong>Status Pagamento:</strong>{' '}
    {pedido.status_pagamento ? '✅ Pago' : '❌ Pendente'}
  </p>
  
  {/* FRETE OFERECIDO - ADICIONADO */}
  {pedido.frete_oferecido && (
    <p>
      <strong>Frete Oferecido:</strong> R${' '}
      {parseFloat(pedido.frete_oferecido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
    </p>
  )}
  
  <p>
    <strong>Frete:</strong> R${' '}
    {parseFloat(pedido.frete_pago || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
  </p>
</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalhes */}
      <OrderModal
        pedido={pedidoSelecionado}
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
      >
        <WithCourier
          pedido={pedidoSelecionado}
          onClose={() => setModalAberto(false)}
        />
      </OrderModal>
    </div>
  );
}