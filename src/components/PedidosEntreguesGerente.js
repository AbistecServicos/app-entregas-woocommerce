// ============================================================================
// IMPORTAÇÕES
// ============================================================================
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { OrderModal, WithCourier } from './OrderModal';
import { gerarRecibosPDF } from '../utils/pdfUtils';

// ============================================================================
// COMPONENTE: PEDIDOS ENTREGUES - GERENTE (VERSÃO SEGURA)
// ============================================================================
export default function PedidosEntreguesGerente({ userProfile }) {
  // ==========================================================================
  // 1. ESTADOS DO COMPONENTE
  // ==========================================================================
  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataPagamento, setDataPagamento] = useState('');
  const [pedidosSelecionados, setPedidosSelecionados] = useState(new Set());
  const [totalSelecionados, setTotalSelecionados] = useState(0.0);
  const [filtroEntregador, setFiltroEntregador] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [entregadores, setEntregadores] = useState([]);
  const [lojaInfo, setLojaInfo] = useState({ id_loja: null, loja_nome: null });
  const [error, setError] = useState(null);

  // ==========================================================================
  // 2. CARREGAR LOJA DO GERENTE
  // ==========================================================================
  useEffect(() => {
    const carregarLojaGerente = async () => {
      if (!userProfile?.uid) {
        setError('Usuário não autenticado.');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('loja_associada')
          .select('id_loja, loja_nome')
          .eq('uid_usuario', userProfile.uid)
          .eq('funcao', 'gerente')
          .single();

        if (error) throw error;
        if (!data) {
          setError('Usuário sem loja associada como gerente.');
          return;
        }

        setLojaInfo({ id_loja: data.id_loja, loja_nome: data.loja_nome });
      } catch (err) {
        console.error('Erro ao carregar loja do gerente:', err.message);
        setError('Falha ao carregar loja associada.');
      }
    };

    carregarLojaGerente();
  }, [userProfile]);

  // ==========================================================================
  // 3. CARREGAR ENTREGADORES DA LOJA DO GERENTE
  // ==========================================================================
  useEffect(() => {
    const carregarEntregadores = async () => {
      if (!lojaInfo.id_loja) return;

      try {
        const { data, error } = await supabase
          .from('loja_associada')
          .select('nome_completo, uid_usuario')
          .eq('funcao', 'entregador')
          .eq('id_loja', lojaInfo.id_loja)
          .order('nome_completo');

        if (error) throw error;
        setEntregadores(data.map(u => u.nome_completo).filter(Boolean) || []);
      } catch (error) {
        console.error('Erro ao carregar entregadores:', error.message);
        setError('Falha ao carregar entregadores.');
      }
    };

    carregarEntregadores();
  }, [lojaInfo]);

  // ==========================================================================
  // 4. CARREGAR PEDIDOS DA LOJA DO GERENTE (COM frete_ja_processado)
  // ==========================================================================
  const carregarPedidos = async () => {
    setIsLoading(true);
    try {
      if (!lojaInfo.id_loja) {
        setError('Usuário sem loja associada.');
        return;
      }

      let query = supabase
        .from('pedidos')
        .select('*')
        .eq('status_transporte', 'entregue')
        .eq('id_loja', lojaInfo.id_loja);

      if (filtroEntregador) {
        query = query.ilike('aceito_por_nome', `%${filtroEntregador}%`);
      }
      if (filtroStatus) {
        query = query.eq('status_pagamento', filtroStatus === 'true');
      }

      const { data, error } = await query;
      if (error) throw error;

      setPedidos(data || []);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err.message);
      setError('Falha ao carregar pedidos.');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================================
  // 5. CALCULAR TOTAIS DOS PEDIDOS SELECIONADOS
  // ==========================================================================
  const calcularTotais = useCallback(() => {
    const total = Array.from(pedidosSelecionados).reduce((sum, id) => {
      const pedido = pedidos.find(p => p.id === id);
      return sum + (parseFloat(pedido?.frete_pago) || 0.0);
    }, 0.0);
    setTotalSelecionados(total);
  }, [pedidosSelecionados, pedidos]);

// ==========================================================================
// 6. ATUALIZAR PAGAMENTOS DOS PEDIDOS SELECIONADOS (COM DEBUG)
// ==========================================================================
const atualizarPedidos = async () => {
    if (pedidosSelecionados.size === 0) {
        alert('Selecione pelo menos um pedido.');
        return;
    }
    if (!dataPagamento) {
        alert('Selecione uma data de pagamento.');
        return;
    }

    // ✅ DEBUG: Verificar o formato da data
    console.log('🔍 DEBUG - Data selecionada:', {
        dataOriginal: dataPagamento,
        tipo: typeof dataPagamento,
        timestamp: new Date(dataPagamento).getTime(),
        dataISO: new Date(dataPagamento).toISOString().split('T')[0]
    });

    // Verificar se algum pedido já foi processado
    const pedidosJaProcessados = pedidos.filter(p => 
        pedidosSelecionados.has(p.id) && p.frete_ja_processado === true
    );

    if (pedidosJaProcessados.length > 0) {
        alert(`⚠️ ${pedidosJaProcessados.length} pedido(s) já foram processados e não podem ser alterados.`);
        return;
    }

    try {
        const updates = Array.from(pedidosSelecionados).map(async (id) => {
            const pedido = pedidos.find(p => p.id === id);
            const fretePago = parseFloat(pedido?.frete_pago) || 0.0;

            // ✅ GARANTIR formato ISO
            const dataPagamentoISO = new Date(dataPagamento).toISOString().split('T')[0];
            
            console.log('📤 Enviando para Supabase:', {
                pedidoId: id,
                fretePago: fretePago,
                dataPagamento: dataPagamentoISO,
                dataOriginal: dataPagamento
            });

            const { error } = await supabase
                .from('pedidos')
                .update({
                    status_pagamento: fretePago > 0,
                    data_pagamento: dataPagamentoISO, // ✅ FORMATO ISO GARANTIDO
                    frete_pago: fretePago,
                    frete_ja_processado: true
                })
                .eq('id', id);

            if (error) {
                console.error('❌ Erro no update:', error);
                throw error;
            }
        });

        await Promise.all(updates);
        alert('✅ Pagamentos processados com sucesso! Os valores foram somados aos totais do entregador.');
        carregarPedidos();
        setPedidosSelecionados(new Set());
        setDataPagamento('');
    } catch (err) {
        console.error('Erro ao atualizar pedidos:', err.message);
        alert('❌ Erro ao processar pagamentos. Verifique o console.');
    }
};

// ==========================================================================
// 7. MANIPULAR SELEÇÃO DE PEDIDOS (BLOQUEAR JA PROCESSADOS OU COM DATA)
// ==========================================================================
const handleSelecionarPedido = (pedidoId, isChecked) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    
    // ✅ BLOQUEAR SE: Já processado OU já tem data de pagamento
    const pedidoBloqueado = pedido?.frete_ja_processado || pedido?.data_pagamento;
    
    if (pedidoBloqueado) {
        alert('⚠️ Este pedido já foi processado e não pode ser alterado.');
        return;
    }

    const newSet = new Set(pedidosSelecionados);
    if (isChecked) newSet.add(pedidoId);
    else newSet.delete(pedidoId);
    setPedidosSelecionados(newSet);
};

// ==========================================================================
// 8. ATUALIZAR VALOR DO FRETE (BLOQUEAR SE JÁ PROCESSADO OU COM DATA)
// ==========================================================================
const handleAtualizarFrete = async (pedidoId, novoValor) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    
    // ✅ BLOQUEAR SE: Já processado OU já tem data de pagamento
    const pedidoBloqueado = pedido?.frete_ja_processado || pedido?.data_pagamento;
    
    if (pedidoBloqueado) {
        alert('⚠️ Este pedido já foi processado. O frete não pode ser alterado.');
        return;
    }

    try {
        const { error } = await supabase
            .from('pedidos')
            .update({ frete_pago: parseFloat(novoValor) || 0 })
            .eq('id', pedidoId);

        if (error) throw error;

        setPedidos(prevPedidos =>
            prevPedidos.map(p => p.id === pedidoId ? { ...p, frete_pago: novoValor } : p)
        );
    } catch (err) {
        console.error('Erro ao atualizar frete:', err.message);
        setError('Falha ao atualizar frete.');
    }
};

  // ==========================================================================
  // 9. ABRIR MODAL DE DETALHES
  // ==========================================================================
  const abrirModalDetalhes = (pedido) => {
    if (pedido) {
      setPedidoSelecionado(pedido);
      setModalAberto(true);
    }
  };

  // ==========================================================================
  // 10. USEEFFECTS
  // ==========================================================================
  useEffect(() => {
    if (lojaInfo.id_loja) carregarPedidos();
  }, [lojaInfo, filtroEntregador, filtroStatus]);

  useEffect(() => {
    calcularTotais();
  }, [pedidosSelecionados, pedidos, calcularTotais]);

  // ==========================================================================
  // 11. FORMATAR DATA PARA EXIBIÇÃO
  // ==========================================================================
  const formatarDataParaExibicao = (dataString) => {
    if (!dataString) return '-';
    try {
      return new Date(dataString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  // ==========================================================================
  // 12. RENDERIZAÇÃO
  // ==========================================================================
  return (
    <div className="bg-gray-50 min-h-screen p-4">
      {/* Modal de Detalhes */}
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

      {/* Cabeçalho com nome da loja */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-4 sticky top-4 z-10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-purple-800">Pedidos Entregues</h1>
            <p className="text-sm text-gray-600">
              Loja: {lojaInfo.loja_nome || lojaInfo.id_loja || 'Não definida'}
            </p>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">
              {pedidosSelecionados.size} selecionados
            </span>
            <span className="text-lg font-semibold text-green-600">
              R$ {totalSelecionados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Filtros: entregador e status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          <select
            value={filtroEntregador}
            onChange={(e) => setFiltroEntregador(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">Todos Entregadores</option>
            {entregadores.map((nome, index) => (
              <option key={index} value={nome}>{nome}</option>
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
            <option value="processado">Processado</option>
          </select>
        </div>

        {/* Data + botões de ação */}
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={dataPagamento}
            onChange={(e) => setDataPagamento(e.target.value)}
            className="flex-grow p-2 border border-gray-300 rounded"
          />
          <button
            onClick={atualizarPedidos}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            disabled={isLoading}
          >
            Processar Pagamento
          </button>
          <button
            onClick={() => gerarRecibosPDF(pedidosSelecionados, pedidos, lojaInfo.id_loja)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            disabled={isLoading || pedidosSelecionados.size === 0}
          >
            Recibo
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        
        {/* Informação sobre pedidos processados */}
<div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
    <p className="text-sm text-yellow-800">
        ⚠️ Pedidos com <span className="font-semibold">data de pagamento</span> ou marcados como 
        <span className="font-semibold"> 🔒 Processado</span> não podem ser alterados
    </p>
</div>
      </div>

      {/* Lista de Pedidos */}
      <div className="container mx-auto px-2">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-purple-600">Carregando pedidos...</p>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-purple-600">Nenhum pedido encontrado para esta loja.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {pedidos.map(pedido => (
              <div key={pedido.id} className={`bg-white rounded-lg shadow p-3 ${
                pedido.frete_ja_processado ? 'border-l-4 border-green-500' : ''
              }`}>
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={pedidosSelecionados.has(pedido.id)}
                    onChange={(e) => handleSelecionarPedido(pedido.id, e.target.checked)}
                    className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                    disabled={pedido.frete_ja_processado}
                  />
                  <div className="flex-1 ml-2">
                    <button
                      onClick={() => abrirModalDetalhes(pedido)}
                      className="text-base font-bold text-purple-800 hover:underline text-left"
                    >
                      Pedido #{pedido.id_loja_woo}
                      {pedido.frete_ja_processado && (
                        <span className="ml-2 text-green-600 text-sm">🔒 Processado</span>
                      )}
                    </button>
                    <p className="text-sm font-semibold text-blue-800">{pedido.loja_nome}</p>
                  </div>
                </div>
                <div className="ml-6 space-y-1 text-sm">
                  <p><strong>Entregador:</strong> {pedido.aceito_por_nome || 'Não informado'}</p>
                  <p><strong>Pago em:</strong> {formatarDataParaExibicao(pedido.data_pagamento)}</p>
                  <p>
                    <strong>Pagamento:</strong>{' '}
                    {pedido.status_pagamento ? '✅ Pago' : '❌ Pendente'}
                  </p>
                  <p className="flex items-center">
                    <strong>Frete Pago: R$</strong>
<input
    type="number"
    step="0.01"
    min="0"
    value={pedido.frete_pago || 0}
    onChange={(e) => handleAtualizarFrete(pedido.id, e.target.value)}
    className={`w-16 p-1 border rounded ml-1 focus:ring-2 ${
        // ✅ BLOQUEAR SE: Já processado OU já tem data de pagamento
        (pedido.frete_ja_processado || pedido.data_pagamento) 
            ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' 
            : 'border-gray-300 focus:ring-purple-500'
    }`}
    disabled={pedido.frete_ja_processado || pedido.data_pagamento || isLoading}
    title={
        (pedido.frete_ja_processado || pedido.data_pagamento) 
            ? 'Frete já processado - não pode ser alterado' 
            : 'Editar valor do frete'
    }
/>
                    {pedido.frete_ja_processado && (
                      <span className="ml-2 text-xs text-gray-500">(bloqueado)</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}