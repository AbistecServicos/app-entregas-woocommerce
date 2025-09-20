// utils/pdfUtils.js
import { jsPDF } from 'jspdf';

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
 * Gera recibos em PDF agrupados por loja
 */
export const gerarRecibosPDF = async (pedidosSelecionados, todosPedidos) => {
  if (pedidosSelecionados.size === 0) {
    alert('Selecione pelo menos um pedido para gerar recibos.');
    return;
  }

  try {
    // Agrupar pedidos por loja
    const pedidosPorLoja = {};
    Array.from(pedidosSelecionados).forEach(id => {
      const pedido = todosPedidos.find(p => p.id === id);
      if (pedido) {
        const lojaId = pedido.id_loja;
        if (!pedidosPorLoja[lojaId]) {
          pedidosPorLoja[lojaId] = {
            loja_nome: pedido.loja_nome,
            loja_logo: pedido.loja_logo,
            entregador: pedido.aceito_por_nome,
            pedidos: []
          };
        }
        pedidosPorLoja[lojaId].pedidos.push({
          id_loja_woo: pedido.id_loja_woo,
          frete_pago: parseFloat(pedido.frete_pago || 0)
        });
      }
    });

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

      // Adicionar logo em ALTA RESOLUÇÃO
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