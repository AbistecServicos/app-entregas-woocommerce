// components/PedidosEntreguesAdmin.js (CORREÇÃO - USAR INSTÂNCIA COMPARTILHADA)
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase'; // ✅ USAR INSTÂNCIA COMPARTILHADA
import { jsPDF } from 'jspdf';

// ==============================================================================
// 1. REMOVER CONFIGURAÇÃO DUPLICADA DO SUPABASE
// ==============================================================================
// ❌ REMOVER ESTAS LINHA:
// const supabaseUrl = 'https://czzidhzzpqegfvvmdgno.supabase.co';
// const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6emlkaHp6cHFlZ2Z2dm1kZ25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTIwMDMsImV4cCI6MjA2ODUyODAwM30.zK2iFp-b4e5vghpHgWGuOk0LooujlyU7kVm4sbM85m0';
// const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ AGORA USA A INSTÂNCIA COMPARTILHADA de '../../lib/supabase'

// ... resto do código mantido igual
// ==============================================================================
// 2. FUNÇÕES AUXILIARES
// ==============================================================================

/**
 * Formata data para o padrão do Supabase (YYYY-MM-DD)
 */
const formatarDataParaSupabase = (dataString) => {
  if (!dataString) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataString)) return dataString;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataString)) {
    const [dia, mes, ano] = dataString.split('/');
    return `${ano}-${mes}-${dia}`;
  }
  return dataString;
};

/**
 * Formata data para exibição (DD/MM/YYYY)
 */
const formatarDataParaExibicao = (dataString) => {
  if (!dataString) return '-';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataString)) {
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataString)) return dataString;
  try {
    const data = new Date(dataString);
    if (!isNaN(data.getTime())) return data.toLocaleDateString('pt-BR');
  } catch (e) {
    console.error('Erro ao formatar data:', e);
  }
  return dataString;
};

// ==============================================================================
// 3. COMPONENTE MODAL DE DETALHES
// ==============================================================================
const ModalDetalhesPedido = ({ pedido, isOpen, onClose }) => {
  if (!isOpen || !pedido) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Cabeçalho do Modal */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-purple-800">Detalhes do Pedido</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
              ×
            </button>
          </div>

          {/* Informações da Loja */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">{pedido.loja_nome}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>ID:</strong> {pedido.id}</p>
                <p><strong>Pedido:</strong> {pedido.id_loja_woo}</p>
                <p><strong>Data:</strong> {pedido.data ? new Date(pedido.data).toLocaleString('pt-BR') : 'N/A'}</p>
              </div>
              <div>
                <p><strong>Telefone da Loja:</strong> {pedido.loja_telefone || 'N/A'}</p>
                <p><strong>Status:</strong> {pedido.status_transporte || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Informações do Cliente */}
          <div className="mb-6 p-4 bg-gray-50 rounded">
            <h4 className="font-semibold text-gray-800 mb-2">Cliente</h4>
            <p><strong>Nome:</strong> {pedido.nome_cliente || 'N/A'}</p>
            <p><strong>Telefone:</strong> {pedido.telefone_cliente || 'N/A'}</p>
            <p><strong>Email:</strong> {pedido.email_cliente || 'N/A'}</p>
            <p><strong>Endereço:</strong> {pedido.endereco_entrega || 'N/A'}</p>
          </div>

          {/* Produtos */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-2">Produtos</h4>
            <div className="bg-white border rounded p-3">
              {pedido.produto ? (
                <pre className="text-sm whitespace-pre-wrap">{pedido.produto}</pre>
              ) : (
                <p>Nenhum produto informado</p>
              )}
            </div>
          </div>

          {/* Informações de Pagamento e Total */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p><strong>Forma de Pagamento:</strong> {pedido.forma_pagamento || 'N/A'}</p>
              <p><strong>Total:</strong> R$ {parseFloat(pedido.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p><strong>Frete Pago:</strong> R$ {parseFloat(pedido.frete_pago || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p><strong>Status Pagamento:</strong> {pedido.status_pagamento ? 'Pago' : 'Pendente'}</p>
              <p><strong>Data Pagamento:</strong> {formatarDataParaExibicao(pedido.data_pagamento)}</p>
            </div>
          </div>

          {/* Observações */}
          {pedido.observacao_pedido && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-2">Observações</h4>
              <p className="bg-yellow-50 p-3 rounded">{pedido.observacao_pedido}</p>
            </div>
          )}

          {/* Entregador */}
          <div className="mb-6 p-4 bg-purple-50 rounded">
            <h4 className="font-semibold text-purple-800 mb-2">Entregador</h4>
            <p><strong>Nome:</strong> {pedido.aceito_por_nome || 'N/A'}</p>
            <p><strong>Telefone:</strong> {pedido.aceito_por_telefone || 'N/A'}</p>
            <p><strong>Email:</strong> {pedido.aceito_por_email || 'N/A'}</p>
          </div>

          {/* Botão Fechar */}
          <div className="flex justify-end">
            <button onClick={onClose} className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 transition-colors">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==============================================================================
// 4. FUNÇÕES DE CARREGAMENTO DE IMAGEM E GERAÇÃO DE PDF (CORRIGIDAS)
// ==============================================================================

/**
 * Carrega uma imagem a partir de uma URL e retorna dados base64 com formato detectado
 */
const carregarImagem = async (url) => {
  try {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return null;
    }

    const urlComTimestamp = url.includes('?') 
      ? `${url}&t=${Date.now()}`
      : `${url}?t=${Date.now()}`;

    const response = await fetch(urlComTimestamp);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    if (!blob.type.startsWith('image/')) {
      return null;
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result && typeof reader.result === 'string') {
          const img = new Image();
          img.onload = () => {
            resolve({
              data: reader.result,
              format: blob.type.split('/')[1].toUpperCase()
            });
          };
          img.onerror = () => {
            resolve(null);
          };
          img.src = reader.result;
        } else {
          resolve(null);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    return null;
  }
};

/**
 * Busca logo da loja na tabela lojas (NOVA FUNÇÃO)
 */
const buscarLogoDaLoja = async (idLoja) => {
  try {
    const { data, error } = await supabase
      .from('lojas')
      .select('loja_logo')
      .eq('id_loja', idLoja)
      .single();

    if (error) throw error;
    return data?.loja_logo || null;
  } catch (error) {
    console.error('Erro ao buscar logo da loja:', error);
    return null;
  }
};

/**
 * Gera recibos em PDF agrupados por loja (CORRIGIDO)
 */
const gerarRecibosPDF = async (pedidosSelecionados, todosPedidos) => {
  if (pedidosSelecionados.size === 0) {
    alert('Selecione pelo menos um pedido para gerar recibos.');
    return;
  }

  try {
    // Agrupar pedidos por loja e buscar logos
    const pedidosPorLoja = {};
    
    for (const id of Array.from(pedidosSelecionados)) {
      const pedido = todosPedidos.find(p => p.id === id);
      if (pedido) {
        const lojaId = pedido.id_loja;
        
        if (!pedidosPorLoja[lojaId]) {
          // ✅ CORREÇÃO: Buscar logo da tabela lojas
          const lojaLogo = await buscarLogoDaLoja(lojaId);
          
          pedidosPorLoja[lojaId] = {
            loja_nome: pedido.loja_nome,
            loja_logo: lojaLogo, // ✅ Agora vem da tabela lojas
            entregador: pedido.aceito_por_nome,
            pedidos: []
          };
        }
        
        pedidosPorLoja[lojaId].pedidos.push({
          id_loja_woo: pedido.id_loja_woo,
          frete_pago: parseFloat(pedido.frete_pago || 0)
        });
      }
    }

    // Criar PDF com configurações de alta qualidade
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: false
    });

    // Configurar propriedades do PDF
    pdf.setProperties({
      title: 'Recibos de Fretes',
      subject: 'Relatório de pedidos entregues',
      creator: 'Sistema de Gestão'
    });

    let yPosition = 20;

    // Processar cada loja
    for (const loja of Object.values(pedidosPorLoja)) {
      const pageIndex = Object.values(pedidosPorLoja).indexOf(loja);
      if (pageIndex > 0) {
        pdf.addPage();
        yPosition = 20;
      }

      // Adicionar logo em ALTA RESOLUÇÃO (se existir)
      if (loja.loja_logo) {
        try {
          const imagem = await carregarImagem(loja.loja_logo);
          if (imagem && imagem.data) {
            const img = new Image();
            img.src = imagem.data;
            
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });
            
            // Ajustar tamanho mantendo proporção
            const maxWidth = 80;
            const maxHeight = 80;
            const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
            const width = img.width * ratio;
            const height = img.height * ratio;
            const xPos = (210 - width) / 2;
            
            // Adicionar imagem ao PDF
            pdf.addImage({
              imageData: imagem.data,
              format: imagem.format,
              x: xPos,
              y: yPosition,
              width: width,
              height: height,
              compression: 'NONE'
            });
            
            yPosition += height + 15;
          }
        } catch (error) {
          console.warn('Logo não carregada:', error);
          yPosition += 10;
        }
      }

      // Título
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RECIBO DE FRETES', 105, yPosition, { align: 'center' });
      yPosition += 10;

      // Data
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 105, yPosition, { align: 'center' });
      yPosition += 15;

      // Informações
      pdf.text(`Entregador: ${loja.entregador || 'Não informado'}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Empresa: ${loja.loja_nome}`, 20, yPosition);
      yPosition += 15;

      // Lista de pedidos
      pdf.setFont('helvetica', 'bold');
      pdf.text('PEDIDOS ENTREGUES:', 20, yPosition);
      yPosition += 10;

      pdf.setFont('helvetica', 'normal');
      let totalLoja = 0;
      
      loja.pedidos.forEach(pedido => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        
        const texto = `${pedido.id_loja_woo} - R$ ${pedido.frete_pago.toFixed(2)}`;
        pdf.text(texto, 25, yPosition);
        yPosition += 8;
        totalLoja += pedido.frete_pago;
      });

      yPosition += 10;

      // Total
      pdf.setFont('helvetica', 'bold');
      pdf.text(`TOTAL: R$ ${totalLoja.toFixed(2)}`, 20, yPosition);
      yPosition += 15;

      // Linha de assinatura
      pdf.setLineWidth(0.5);
      pdf.line(20, yPosition, 190, yPosition);
      yPosition += 5;
      
      pdf.setFontSize(11);
      pdf.text('Assinatura do Responsável', 20, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(10);
      pdf.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, yPosition);
      yPosition += 20;
    }

    // Salvar PDF
    const dataAtual = new Date().toISOString().split('T')[0];
    pdf.save(`recibos-fretes-${dataAtual}.pdf`);

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF. Verifique o console.');
  }
};

// ==============================================================================
// 5. COMPONENTE PRINCIPAL (CORRIGIDO)
// ==============================================================================
export default function PedidosEntreguesAdmin() {
  // Estados do componente
  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataPagamento, setDataPagamento] = useState('');
  const [pedidosSelecionados, setPedidosSelecionados] = useState(new Set());
  const [totalSelecionados, setTotalSelecionados] = useState(0.0);
  const [filtroEntregador, setFiltroEntregador] = useState('');
  const [filtroLoja, setFiltroLoja] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);

  // ============================================================================
  // 5.1 FUNÇÕES DE CÁLCULO E CARREGAMENTO (CORRIGIDAS)
  // ============================================================================

  /**
   * Calcula o total dos pedidos selecionados
   */
  const calcularTotais = useCallback((pedidosList, selecionados) => {
    const total = Array.from(selecionados).reduce((sum, id) => {
      const pedido = pedidosList.find(p => p.id === id);
      return sum + (parseFloat(pedido?.frete_pago) || 0.0);
    }, 0.0);
    setTotalSelecionados(total);
  }, []);

  /**
   * Carrega pedidos do Supabase com filtros aplicados (CORRIGIDO)
   */
  const carregarPedidos = async () => {
    setIsLoading(true);
    try {
      // ✅ CORREÇÃO: Removido 'loja_logo' da query
      let query = supabase.from('pedidos').select('*').eq('status_transporte', 'entregue');
      
      if (filtroEntregador) query = query.ilike('aceito_por_nome', `%${filtroEntregador}%`);
      if (filtroLoja) query = query.eq('id_loja', filtroLoja);
      if (filtroStatus) query = query.eq('status_pagamento', filtroStatus === 'true');
      
      const { data, error } = await query;
      if (error) throw error;
      
      setPedidos(data || []);
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Atualiza pedidos selecionados no Supabase
   */
  const atualizarPedidos = async () => {
    if (pedidosSelecionados.size === 0) {
      alert('Selecione pelo menos um pedido.');
      return;
    }
    
    if (!dataPagamento) {
      alert('Selecione uma data de pagamento.');
      return;
    }
    
    const dataFormatada = formatarDataParaSupabase(dataPagamento);
    
    try {
      const updates = Array.from(pedidosSelecionados).map(async (id) => {
        const pedido = pedidos.find(p => p.id === id);
        const fretePago = parseFloat(pedido?.frete_pago) || 0.0;
        
        const { error } = await supabase
          .from('pedidos')
          .update({
            frete_pago: fretePago,
            status_pagamento: fretePago > 0,
            data_pagamento: dataFormatada,
          })
          .eq('id', id);
        
        if (error) throw error;
      });

      await Promise.all(updates);
      alert('Pedidos atualizados com sucesso!');
      
      // Atualizar estado local
      setPedidos(prevPedidos => 
        prevPedidos.map(pedido => 
          pedidosSelecionados.has(pedido.id) 
            ? { 
                ...pedido, 
                data_pagamento: dataFormatada,
                status_pagamento: parseFloat(pedido.frete_pago || 0) > 0
              } 
            : pedido
        )
      );
      
      setPedidosSelecionados(new Set());
      
    } catch (err) {
      console.error('Erro ao atualizar pedidos:', err.message);
      alert('Erro ao atualizar. Verifique o console.');
    }
  };

  // ============================================================================
  // 5.2 HANDLERS DE INTERAÇÃO
  // ============================================================================

  /**
   * Manipula seleção/deseleção de pedidos
   */
  const handleSelecionarPedido = (pedidoId, isChecked) => {
    const newSet = new Set(pedidosSelecionados);
    if (isChecked) {
      newSet.add(pedidoId);
    } else {
      newSet.delete(pedidoId);
    }
    setPedidosSelecionados(newSet);
  };

  /**
   * Atualiza valor do frete de um pedido
   */
  const handleAtualizarFrete = (pedidoId, novoValor) => {
    const newPedidos = pedidos.map(p => 
      p.id === pedidoId ? { ...p, frete_pago: novoValor } : p
    );
    setPedidos(newPedidos);
  };

  /**
   * Abre modal com detalhes do pedido
   */
  const abrirModalDetalhes = (pedido) => {
    setPedidoSelecionado(pedido);
    setModalAberto(true);
  };

  /**
   * Fecha modal de detalhes
   */
  const fecharModal = () => {
    setModalAberto(false);
    setPedidoSelecionado(null);
  };

  // ============================================================================
  // 5.3 USE EFFECTS
  // ============================================================================

  // Carrega pedidos quando os filtros mudam
  useEffect(() => {
    carregarPedidos();
  }, [filtroEntregador, filtroLoja, filtroStatus]);

  // Calcula totais quando a seleção ou pedidos mudam
  useEffect(() => {
    calcularTotais(pedidos, pedidosSelecionados);
  }, [pedidosSelecionados, pedidos, calcularTotais]);

  // ============================================================================
  // 5.4 DADOS DERIVADOS
  // ============================================================================

  // Lista de lojas únicas para o filtro
  const lojasUnicas = [...new Set(pedidos.map(p => p.id_loja))].map(id => {
    const nome = pedidos.find(p => p.id_loja === id)?.loja_nome;
    return { id, nome: nome || id };
  });

  // ============================================================================
  // 5.5 RENDERIZAÇÃO DO COMPONENTE
  // ============================================================================

  return (
    <div className="bg-gray-50 min-h-screen mobile-optimized">
      {/* Modal de Detalhes */}
      <ModalDetalhesPedido
        pedido={pedidoSelecionado}
        isOpen={modalAberto}
        onClose={fecharModal}
      />

      {/* Cabeçalho Otimizado para Mobile */}
      <div className="bg-white shadow-md rounded-lg p-3 mb-3 sticky top-2 z-10 mobile-header">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-bold text-purple-800">Pedidos Entregues</h1>
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">{pedidosSelecionados.size}</span>
            <div className="text-lg font-semibold text-green-600">
              R$ {totalSelecionados.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Filtros sem rótulos */}
        <div className="grid grid-cols-1 gap-2 mb-3">
          <select
            value={filtroEntregador}
            onChange={(e) => setFiltroEntregador(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mobile-field"
          >
            <option value="">Todos Entregadores</option>
            {[...new Set(pedidos.map(p => p.aceito_por_nome).filter(Boolean))].map((nome, index) => (
              <option key={index} value={nome}>{nome}</option>
            ))}
          </select>
          <select
            value={filtroLoja}
            onChange={(e) => setFiltroLoja(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mobile-field"
          >
            <option value="">Todas Lojas</option>
            {lojasUnicas.map(loja => (
              <option key={loja.id} value={loja.id}>{loja.nome}</option>
            ))}
          </select>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mobile-field"
          >
            <option value="">Todos Status</option>
            <option value="true">Pago</option>
            <option value="false">Pendente</option>
          </select>
        </div>

        {/* Data e Botões na mesma linha */}
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={dataPagamento}
            onChange={(e) => setDataPagamento(e.target.value)}
            className="flex-grow p-2 border border-gray-300 rounded mobile-field"
          />
          <button 
            onClick={atualizarPedidos} 
            className="bg-purple-600 text-white p-2 rounded hover:bg-purple-700 transition-colors font-semibold mobile-button flex-grow text-center"
          >
            Atualizar
          </button>
          <button 
            onClick={async () => await gerarRecibosPDF(pedidosSelecionados, pedidos)}
            className="bg-green-600 text-white p-2 rounded hover:bg-green-700 transition-colors font-semibold mobile-button flex-grow text-center"
          >
            Recibo
          </button>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="container mx-auto px-2">
        <div className="grid grid-cols-1 gap-3">
          {isLoading ? (
            <div className="col-span-full text-center py-8">
              <p className="text-purple-600">Carregando...</p>
            </div>
          ) : pedidos.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-purple-600">Nenhum pedido encontrado.</p>
            </div>
          ) : (
            pedidos.map(pedido => (
              <div key={pedido.id} className="bg-white rounded-lg shadow card-pedido p-3">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={pedidosSelecionados.has(pedido.id)}
                    onChange={(e) => handleSelecionarPedido(pedido.id, e.target.checked)}
                    className="mobile-checkbox h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <div className="flex-1 ml-2">
                    <button
                      onClick={() => abrirModalDetalhes(pedido)}
                      className="text-base font-bold text-purple-800 hover:text-purple-600 hover:underline text-left"
                    >
                      Pedido #{pedido.id_loja_woo}
                    </button>
                    <p className="text-sm font-semibold text-blue-800 mobile-text-small">{pedido.loja_nome}</p>
                  </div>
                </div>
                <div className="ml-6 space-y-1 mobile-text-small">
                  <p><span className="font-semibold">Entregador:</span> {pedido.aceito_por_nome || 'Não informado'}</p>
                  <p><span className="font-semibold">Pago em:</span> {formatarDataParaExibicao(pedido.data_pagamento)}</p>
                  <p className="flex items-center">
                    <span className="font-semibold mr-1">Pagamento:</span> 
                    {pedido.status_pagamento ? (
                      <span className="text-green-600 mr-1">✔</span>
                    ) : (
                      <span className="text-red-600 mr-1">✘</span>
                    )} 
                    {pedido.status_pagamento ? 'Pago' : 'Pendente'}
                  </p>
                  <p className="flex items-center">
                    <span className="font-semibold">Frete Pago: R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pedido.frete_pago || 0.0}
                      onChange={(e) => handleAtualizarFrete(pedido.id, e.target.value)}
                      className="w-16 p-1 border border-gray-300 rounded ml-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent mobile-text-small"
                    />
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

{/* Estilos inline para mobile */}
<style jsx>{`
  @media (max-width: 768px) {
    .mobile-optimized :global(*) {
      font-size: 14px !important;
    }
    .mobile-header :global(*) {
      padding: 0px 10px !important;
    }
    .mobile-field :global(*) {
      padding: 10px !important;
      font-size: 14px !important;
    }
    .mobile-button :global(*) {
      padding: 10px 12px !important;
      font-size: 14px !important;
    }
    .mobile-text-small :global(*) {
      font-size: 13px !important;
    }
    .mobile-checkbox :global(*) {
      width: 18px !important;
      height: 18px !important;
    }
  }

  /* Estilos para tablet/PC (acima de 768px) - mantém o padrão */
  @media (min-width: 769px) {
    .mobile-header :global(*) {
      padding: 12px 10px !important; /* Valor original para tablet/PC */
    }
  }
`}</style>
    </div>
  );
}