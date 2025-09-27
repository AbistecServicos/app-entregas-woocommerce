// src/utils/pdfUtils.js
import { jsPDF } from 'jspdf';
import { supabase } from '../../lib/supabase'; // Caminho corrigido (subir 2 níveis)

// ==============================================================================
// FUNÇÕES UTILITÁRIAS PARA GERAÇÃO DE PDF
// ==============================================================================

/**
 * Carrega uma imagem a partir de uma URL e retorna dados base64 com formato detectado
 */
export const carregarImagem = async (url) => {
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
 * Busca informações da loja (logo e nome)
 */
const buscarInfoLoja = async (idLoja) => {
  try {
    const { data, error } = await supabase
      .from('lojas')
      .select('loja_nome, loja_logo')
      .eq('id_loja', idLoja)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar info da loja:', error);
    return null;
  }
};

/**
 * Gera recibos em PDF AGRUPADOS POR ENTREGADOR
 */
export const gerarRecibosPDF = async (pedidosSelecionados, todosPedidos) => {
  if (pedidosSelecionados.size === 0) {
    alert('Selecione pelo menos um pedido para gerar recibos.');
    return;
  }

  try {
    // Pegar o primeiro pedido para obter o ID da loja (todos são da mesma loja)
    const primeiroPedido = todosPedidos.find(p => pedidosSelecionados.has(p.id));
    if (!primeiroPedido) {
      alert('Nenhum pedido válido selecionado.');
      return;
    }

    const idLoja = primeiroPedido.id_loja;
    
    // Buscar informações da loja (logo e nome)
    const infoLoja = await buscarInfoLoja(idLoja);

    // Agrupar pedidos por ENTREGADOR
    const pedidosPorEntregador = {};
    
    Array.from(pedidosSelecionados).forEach(id => {
      const pedido = todosPedidos.find(p => p.id === id);
      if (pedido) {
        const entregador = pedido.aceito_por_nome || 'Entregador não informado';
        
        if (!pedidosPorEntregador[entregador]) {
          pedidosPorEntregador[entregador] = {
            entregador: entregador,
            pedidos: []
          };
        }
        
        pedidosPorEntregador[entregador].pedidos.push({
          id_loja_woo: pedido.id_loja_woo,
          frete_pago: parseFloat(pedido.frete_pago || 0)
        });
      }
    });

    // Criar PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: false
    });

    // Configurar propriedades do PDF
    pdf.setProperties({
      title: 'Recibos de Fretes por Entregador',
      subject: 'Relatório de pedidos entregues',
      creator: 'Sistema de Gestão'
    });

    let yPosition = 20;

    // Processar CADA ENTREGADOR em páginas separadas
    for (const [entregadorNome, dadosEntregador] of Object.entries(pedidosPorEntregador)) {
      const pageIndex = Object.keys(pedidosPorEntregador).indexOf(entregadorNome);
      
      // Nova página para cada entregador (exceto o primeiro)
      if (pageIndex > 0) {
        pdf.addPage();
        yPosition = 20;
      }

      // Adicionar logo da LOJA
      if (infoLoja?.loja_logo) {
        try {
          const imagem = await carregarImagem(infoLoja.loja_logo);
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

      // Informações da LOJA
      pdf.text(`Empresa: ${infoLoja?.loja_nome || 'Loja não encontrada'}`, 20, yPosition);
      yPosition += 8;
      
      // Informações do ENTREGADOR (DESTAQUE)
      pdf.setFont('helvetica', 'bold');
      pdf.text(`ENTREGADOR: ${entregadorNome}`, 20, yPosition);
      yPosition += 12;

      // Lista de pedidos
      pdf.setFont('helvetica', 'bold');
      pdf.text('PEDIDOS ENTREGUES:', 20, yPosition);
      yPosition += 10;

      pdf.setFont('helvetica', 'normal');
      let totalEntregador = 0;
      
      dadosEntregador.pedidos.forEach(pedido => {
        // Quebra de página se necessário
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        
        const texto = `Pedido #${pedido.id_loja_woo} - R$ ${pedido.frete_pago.toFixed(2)}`;
        pdf.text(texto, 25, yPosition);
        yPosition += 8;
        totalEntregador += pedido.frete_pago;
      });

      yPosition += 10;

      // Total do ENTREGADOR
      pdf.setFont('helvetica', 'bold');
      pdf.text(`TOTAL DO ENTREGADOR: R$ ${totalEntregador.toFixed(2)}`, 20, yPosition);
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

      // Adicionar rodapé com número da página
      const totalPages = Object.keys(pedidosPorEntregador).length;
      pdf.setFontSize(9);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Entregador ${pageIndex + 1} de ${totalPages} - ${entregadorNome}`, 105, 290, { align: 'center' });
      pdf.setTextColor(0, 0, 0); // Resetar cor
    }

    // Salvar PDF
    const dataAtual = new Date().toISOString().split('T')[0];
    const nomeLoja = infoLoja?.loja_nome?.replace(/\s+/g, '-') || 'loja';
    pdf.save(`recibos-fretes-${nomeLoja}-${dataAtual}.pdf`);

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF. Verifique o console.');
  }
};