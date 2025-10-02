// components/PedidosEntreguesGerente.js
// ============================================================================
// IMPORTAÇÕES
// ============================================================================
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { OrderModal, WithCourier } from './OrderModal';
import { gerarRecibosPDF } from '../utils/pdfUtils';

// ============================================================================
// COMPONENTE: PEDIDOS ENTREGUES - GERENTE (VERSÃO COM FRETE OFERECIDO)
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
  const [valoresEditando, setValoresEditando] = useState({});

  // ==========================================================================
  // 2. FUNÇÕES DE FORMATAÇÃO MONETÁRIA
  // ==========================================================================

  // Formatar número para moeda brasileira (123.45 → "123,45")
  const formatarParaMoeda = (valor) => {
    if (valor === null || valor === undefined || valor === '' || valor === 0) return '';
    
    const numero = parseFloat(valor);
    if (isNaN(numero)) return '';
    
    return numero.toFixed(2).replace('.', ',');
  };

  // Converter string monetária para número ("123,45" → 123.45)
  const converterDeMoeda = (valorString) => {
    if (!valorString || valorString === '') return null;
    
    // Remove tudo exceto números e vírgula, depois substitui vírgula por ponto
    const valorLimpo = valorString.replace(/[^\d,]/g, '').replace(',', '.');
    
    const numero = parseFloat(valorLimpo);
    return isNaN(numero) ? null : numero;
  };

  // Aplicar máscara monetária durante a digitação
  const aplicarMascaraMonetaria = (valor) => {
    // Remove tudo exceto números
    let apenasNumeros = valor.replace(/\D/g, '');
    
    // Se estiver vazio, retorna vazio
    if (apenasNumeros === '') return '';
    
    // Converte para número e formata com 2 casas decimais
    const numero = parseInt(apenasNumeros, 10) / 100;
    return numero.toFixed(2).replace('.', ',');
  };

  // ==========================================================================
  // 3. CARREGAR LOJA DO GERENTE
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
  // 4. CARREGAR ENTREGADORES DA LOJA DO GERENTE
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
  // 5. CARREGAR PEDIDOS DA LOJA DO GERENTE (COM frete_ja_processado)
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
  // 6. CALCULAR TOTAIS DOS PEDIDOS SELECIONADOS
  // ==========================================================================
  const calcularTotais = useCallback(() => {
    const total = Array.from(pedidosSelecionados).reduce((sum, id) => {
      const pedido = pedidos.find(p => p.id === id);
      return sum + (parseFloat(pedido?.frete_pago) || 0.0);
    }, 0.0);
    setTotalSelecionados(total);
  }, [pedidosSelecionados, pedidos]);

  // ==========================================================================
  // 7. ATUALIZAR PAGAMENTOS DOS PEDIDOS SELECIONADOS
  // ==========================================================================
  const atualizarPedidos = async () => {
    if (pedidosSelecionados.size === 0) {
      alert('Selecione pelo menos um pedido.');
      return;
    }
    
    if (!dataPagamento) {
      alert('❌ Selecione uma data de pagamento antes de processar.');
      return;
    }

    try {
      const updates = Array.from(pedidosSelecionados).map(async (id) => {
        const pedido = pedidos.find(p => p.id === id);
        const fretePago = parseFloat(pedido?.frete_pago) || 0.0;

        const dataPagamentoISO = new Date(dataPagamento).toISOString().split('T')[0];

        const { error } = await supabase
          .from('pedidos')
          .update({
            status_pagamento: fretePago > 0,
            data_pagamento: dataPagamentoISO,
            frete_pago: fretePago,
            frete_ja_processado: true
          })
          .eq('id', id);

        if (error) throw error;
      });

      await Promise.all(updates);
      alert('✅ Pagamentos processados com sucesso! Os valores foram somados aos totais do entregador.');
      carregarPedidos();
      setDataPagamento('');
    } catch (err) {
      console.error('Erro ao atualizar pedidos:', err.message);
      alert('❌ Erro ao processar pagamentos. Verifique o console.');
    }
  };

  // ==========================================================================
  // 8. MANIPULAR SELEÇÃO DE PEDIDOS
  // ==========================================================================
  const handleSelecionarPedido = (pedidoId, isChecked) => {
    const newSet = new Set(pedidosSelecionados);
    if (isChecked) newSet.add(pedidoId);
    else newSet.delete(pedidoId);
    setPedidosSelecionados(newSet);
  };

  // ==========================================================================
  // 9. ATUALIZAR VALOR DO FRETE COM FORMATAÇÃO MONETÁRIA
  // ==========================================================================
  const handleAtualizarFrete = async (pedidoId, novoValorString) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    
    // BLOQUEAR SE: Já processado OU já tem data de pagamento
    const pedidoBloqueado = pedido?.frete_ja_processado || pedido?.data_pagamento;
    
    if (pedidoBloqueado) {
      alert('⚠️ Este pedido já foi processado. O frete não pode ser alterado.');
      return;
    }

    // Converter string monetária para número
    const valorNumerico = converterDeMoeda(novoValorString);

    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ frete_pago: valorNumerico })
        .eq('id', pedidoId);

      if (error) throw error;

      setPedidos(prevPedidos =>
        prevPedidos.map(p => p.id === pedidoId ? { ...p, frete_pago: valorNumerico } : p)
      );
    } catch (err) {
      console.error('Erro ao atualizar frete:', err.message);
      setError('Falha ao atualizar frete.');
    }
  };

  // ==========================================================================
  // 10. MANIPULAR DIGITAÇÃO DO FRETE EM TEMPO REAL
  // ==========================================================================
  const handleFreteChange = (pedidoId, valorDigitado) => {
    const valorFormatado = aplicarMascaraMonetaria(valorDigitado);
    
    setValoresEditando(prev => ({
      ...prev,
      [pedidoId]: valorFormatado
    }));
  };

  const handleFreteBlur = (pedidoId) => {
    const valorTemp = valoresEditando[pedidoId];
    
    if (valorTemp !== undefined) {
      handleAtualizarFrete(pedidoId, valorTemp);
      
      setValoresEditando(prev => {
        const newState = { ...prev };
        delete newState[pedidoId];
        return newState;
      });
    }
  };

  const handleFreteKeyPress = (e, pedidoId) => {
    if (e.key === 'Enter') {
      handleFreteBlur(pedidoId);
      e.target.blur();
    }
  };

  // ==========================================================================
  // 11. ABRIR MODAL DE DETALHES
  // ==========================================================================
  const abrirModalDetalhes = (pedido) => {
    if (pedido) {
      setPedidoSelecionado(pedido);
      setModalAberto(true);
    }
  };

  // ==========================================================================
  // 12. USEEFFECTS
  // ==========================================================================
  useEffect(() => {
    if (lojaInfo.id_loja) carregarPedidos();
  }, [lojaInfo, filtroEntregador, filtroStatus]);

  useEffect(() => {
    calcularTotais();
  }, [pedidosSelecionados, pedidos, calcularTotais]);

  // ==========================================================================
  // 13. FORMATAR DATA PARA EXIBIÇÃO
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
  // 14. RENDERIZAÇÃO
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
      <div className="bg-white shadow-md rounded-lg p-4 mb-4 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-purple-800">Pedidos Entregues</h1>
            <p className="text-xs md:text-sm text-gray-600">
              Loja: {lojaInfo.loja_nome || lojaInfo.id_loja || 'Não definida'}
            </p>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2 hidden md:inline">
              {pedidosSelecionados.size} selecionados
            </span>
            <span className="text-sm md:text-lg font-semibold text-green-600">
              R$ {totalSelecionados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Filtros: entregador e status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          <select
            value={filtroEntregador}
            onChange={(e) => setFiltroEntregador(e.target.value)}
            className="w-full p-1 md:p-2 border border-gray-300 rounded text-sm md:text-base"
          >
            <option value="">Todos Entregadores</option>
            {entregadores.map((nome, index) => (
              <option key={index} value={nome}>{nome}</option>
            ))}
          </select>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="w-full p-1 md:p-2 border border-gray-300 rounded text-sm md:text-base"
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
            className="flex-grow p-1 md:p-2 border border-gray-300 rounded text-sm md:text-base"
          />
          <button
            onClick={atualizarPedidos}
            className="bg-purple-600 text-white px-3 md:px-4 py-1 md:py-2 rounded hover:bg-purple-700 text-sm md:text-base"
            disabled={isLoading}
          >
            <span className="md:hidden">Pagar</span>
            <span className="hidden md:inline">Processar Pagamento</span>
          </button>
          <button
            onClick={() => gerarRecibosPDF(pedidosSelecionados, pedidos)}
            className="bg-green-600 text-white px-3 md:px-4 py-1 md:py-2 rounded hover:bg-green-700 text-sm md:text-base"
            disabled={isLoading || pedidosSelecionados.size === 0}
          >
            Recibo
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded hidden md:block">
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
                    className="h-5 w-5 md:h-4 md:w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    title={
                      (pedido.frete_ja_processado || pedido.data_pagamento) 
                        ? 'Pedido processado - pode selecionar para recibo' 
                        : 'Selecionar pedido'
                    }
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
                  
                  {/* ✅ FRETE OFERECIDO ADICIONADO - SEGUINDO O PADRÃO DO ENTREGADOR */}
                  {pedido.frete_oferecido && (
                    <p>
                      <strong>Frete Oferecido:</strong> R${' '}
                      {parseFloat(pedido.frete_oferecido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                  
                  <p className="flex items-center">
                    <strong>Frete Pago: R$</strong>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={valoresEditando[pedido.id] !== undefined 
                        ? valoresEditando[pedido.id] 
                        : formatarParaMoeda(pedido.frete_pago)
                      }
                      onChange={(e) => handleFreteChange(pedido.id, e.target.value)}
                      onBlur={() => handleFreteBlur(pedido.id)}
                      onKeyPress={(e) => handleFreteKeyPress(e, pedido.id)}
                      onFocus={(e) => {
                        e.target.select();
                        if (valoresEditando[pedido.id] === undefined) {
                          setValoresEditando(prev => ({
                            ...prev,
                            [pedido.id]: formatarParaMoeda(pedido.frete_pago)
                          }));
                        }
                      }}
                      className={`w-24 p-1 border rounded ml-1 focus:ring-2 ${
                        (pedido.frete_ja_processado || pedido.data_pagamento) 
                          ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'border-gray-300 focus:ring-purple-500'
                      }`}
                      disabled={pedido.frete_ja_processado || pedido.data_pagamento || isLoading}
                      title={
                        (pedido.frete_ja_processado || pedido.data_pagamento) 
                          ? 'Frete já processado - não pode ser alterado' 
                          : 'Digite o valor (ex: 25,50)'
                      }
                      placeholder="0,00"
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