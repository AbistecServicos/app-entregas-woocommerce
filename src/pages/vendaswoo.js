import { useState, useEffect } from 'react';
import Head from 'next/head';
import Script from 'next/script';

// ==============================================================================
// PÁGINA VENDAS WOO - FANPAGE PARA CAPTAÇÃO DE CLIENTES
// ==============================================================================
/**
 * Página de vendas/publicidade para captação de clientes para o sistema WooCommerce
 * Landing page com informações sobre o sistema e call-to-action
 */
export default function VendasWoo() {
  const [isVisible, setIsVisible] = useState(false);

  // ============================================================================
  // EFFECT: ANIMAÇÃO DE ENTRADA
  // ============================================================================
  useEffect(() => {
    setIsVisible(true);
    
    // Animação intermitente do botão CTA
    const interval = setInterval(() => {
      const ctaBtn = document.querySelector('.btn-cta');
      if (ctaBtn) {
        ctaBtn.style.transform = 'scale(1.05)';
        setTimeout(() => {
          ctaBtn.style.transform = 'scale(1)';
        }, 500);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // ============================================================================
  // FUNÇÃO: ABRIR CLIENTE DE EMAIL
  // ============================================================================
  const handleAgendarDemonstracao = () => {
    const subject = encodeURIComponent('Solicitação de Demonstração - Sistema E-commerce');
    const body = encodeURIComponent('Olá, gostaria de solicitar uma demonstração do sistema e-commerce.');
    window.open(`mailto:comercial@abistec.com.br?subject=${subject}&body=${body}`);
  };

  // ============================================================================
  // RENDERIZAÇÃO
  // ============================================================================
  return (
    <>
      <Head>
        <title>Informatize seu negócio e aumente seus lucros com pequeno investimento</title>
        <meta name="description" content="Sua loja virtual profissional com gestão simplificada e suporte especializado" />
      </Head>

      {/* Carregamento correto do Font Awesome usando next/script */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />

      <div className={`min-h-screen bg-gray-50 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          
          {/* ================================================================== */}
          {/* HEADER PRINCIPAL */}
          {/* ================================================================== */}
          {/* HEADER PRINCIPAL - VERSÃO OTIMIZADA */}
          <header className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-2xl p-4 sm:p-6 md:p-8 text-center shadow-xl mb-8">
            <div className="logo-container mb-3 sm:mb-4 md:mb-6">
              <img 
                src="https://midias.abistec.com.br/logo_abistec_email.png" 
                alt="Abistec Serviços Tecnológicos" 
                className="max-w-[18rem] sm:max-w-[12rem] md:max-w-[15rem] lg:max-w-[18rem] xl:max-w-[20rem] mx-auto"
              />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-shadow px-2">
              Informatize seu negócio e aumente seus lucros com pequeno investimento
            </h1>
            <p className="text-sm sm:text-lg md:text-xl lg:text-2xl opacity-90 max-w-4xl mx-auto px-4">
              Sua loja virtual profissional com gestão simplificada e suporte especializado
            </p>
          </header>

          {/* ================================================================== */}
          {/* TÍTULO DA SEÇÃO DE FUNCIONALIDADES */}
          {/* ================================================================== */}
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8">
            O que você pode fazer com nosso sistema:
          </h2>

          {/* ================================================================== */}
          {/* SEÇÃO DE FUNCIONALIDADES */}
          {/* ================================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Card 1: Gestão de Produtos */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-t-4 border-yellow-500 transition-transform duration-300 hover:-translate-y-2">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-box-open text-yellow-500 mr-3"></i>
                Gestão de Produtos
              </h3>
              <p className="text-gray-600 mb-4">Controle completo do seu catálogo de produtos:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Adicionar novos produtos</li>
                <li>Organizar por categorias e marcas</li>
                <li>Gerenciar atributos e variações</li>
                <li>Controlar estoque em tempo real</li>
                <li>Administrar avaliações de clientes</li>
              </ul>
            </div>

            {/* Card 2: Gestão de Pedidos */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-t-4 border-yellow-500 transition-transform duration-300 hover:-translate-y-2">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-shopping-cart text-yellow-500 mr-3"></i>
                Gestão de Pedidos
              </h3>
              <p className="text-gray-600 mb-4">Controle completo das vendas e entregas:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Acompanhar todos os pedidos</li>
                <li>Gerenciar status de entrega</li>
                <li>Processar pagamentos PIX</li>
                <li>Comunicação via WhatsApp</li>
                <li>Gestão de clientes</li>
              </ul>
            </div>

            {/* Card 3: Relatórios e Análises */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-t-4 border-yellow-500 transition-transform duration-300 hover:-translate-y-2">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-chart-bar text-yellow-500 mr-3"></i>
                Relatórios e Análises
              </h3>
              <p className="text-gray-600 mb-4">Dados valiosos para o seu negócio:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Visão geral de desempenho</li>
                <li>Relatórios de produtos e receita</li>
                <li>Análise de pedidos e variações</li>
                <li>Relatórios de cupons e impostos</li>
                <li>Controle de downloads e estoque</li>
              </ul>
            </div>

            {/* Card 4: Gestão de Pagamentos */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-t-4 border-yellow-500 transition-transform duration-300 hover:-translate-y-2">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-money-bill-wave text-yellow-500 mr-3"></i>
                Gestão de Pagamentos
              </h3>
              <p className="text-gray-600 mb-4">Múltiplas opções para seus clientes:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Pagamento via PIX</li>
                <li>Retirada no local</li>
                <li>Integração com Mercado Pago</li>
                <li>Pagamento direto em conta</li>
                <li>Diversas outras opções</li>
              </ul>
            </div>

            {/* Card 5: Marketing e Vendas */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-t-4 border-yellow-500 transition-transform duration-300 hover:-translate-y-2">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-bullhorn text-yellow-500 mr-3"></i>
                Marketing e Vendas
              </h3>
              <p className="text-gray-600 mb-4">Ferramentas para aumentar suas vendas:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Cupons de desconto</li>
                <li>Relatórios de marketing</li>
                <li>Análise de desempenho</li>
                <li>Ferramentas de promoção</li>
              </ul>
            </div>

            {/* Card 6: Mídia e Conteúdo */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-t-4 border-yellow-500 transition-transform duration-300 hover:-translate-y-2">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-images text-yellow-500 mr-3"></i>
                Mídia e Conteúdo
              </h3>
              <p className="text-gray-600 mb-4">Gestão de conteúdo da sua loja:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Biblioteca de mídia organizada</li>
                <li>Upload facilitado de imagens</li>
                <li>Gestão de arquivos</li>
              </ul>
            </div>
          </div>

          {/* ================================================================== */}
          {/* SEÇÃO: PAINEL DE CONTROLE */}
          {/* ================================================================== */}
          <div className="bg-white rounded-2xl p-8 shadow-lg mb-12">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">
              Painel de Controle Simplificado
            </h2>
            <p className="text-gray-600 text-center mb-8 max-w-3xl mx-auto">
              Interface otimizada para gerentes de loja com apenas as funcionalidades necessárias:
            </p>
            
            <div className="bg-gray-800 rounded-xl p-6 text-white font-mono">
              <div className="menu-item bg-gray-700 rounded-lg p-3 mb-2 flex items-center">
                <i className="fas fa-images text-yellow-500 mr-3"></i> Mídia
              </div>
              <div className="menu-item bg-gray-700 rounded-lg p-3 mb-2 flex items-center">
                <i className="fas fa-shopping-cart text-yellow-500 mr-3"></i> WooCommerce
              </div>
              <div className="ml-6 space-y-2">
                <div className="menu-item bg-gray-700 rounded-lg p-3 flex items-center">
                  <i className="fas fa-home text-yellow-500 mr-3"></i> Início
                </div>
                <div className="menu-item bg-gray-700 rounded-lg p-3 flex items-center">
                  <i className="fas fa-file-invoice text-yellow-500 mr-3"></i> Pedidos
                </div>
                <div className="menu-item bg-gray-700 rounded-lg p-3 flex items-center">
                  <i className="fas fa-money-bill-wave text-yellow-500 mr-3"></i> PIX
                </div>
                <div className="menu-item bg-gray-700 rounded-lg p-3 flex items-center">
                  <i className="fab fa-whatsapp text-yellow-500 mr-3"></i> Enviar Whatsapp
                </div>
                <div className="menu-item bg-gray-700 rounded-lg p-3 flex items-center">
                  <i className="fas fa-users text-yellow-500 mr-3"></i> Clientes
                </div>
                <div className="menu-item bg-gray-700 rounded-lg p-3 flex items-center">
                  <i className="fas fa-chart-bar text-yellow-500 mr-3"></i> Relatórios
                </div>
                <div className="menu-item bg-gray-700 rounded-lg p-3 flex items-center">
                  <i className="fas fa-cog text-yellow-500 mr-3"></i> Configurações
                </div>
              </div>
              <div className="menu-item bg-gray-700 rounded-lg p-3 mt-2 flex items-center">
                <i className="fas fa-box text-yellow-500 mr-3"></i> Produtos
              </div>
              <div className="menu-item bg-gray-700 rounded-lg p-3 mt-2 flex items-center">
                <i className="fas fa-percentage text-yellow-500 mr-3"></i> Cupons
              </div>
              <div className="menu-item bg-gray-700 rounded-lg p-3 mt-2 flex items-center">
                <i className="fas fa-user text-yellow-500 mr-3"></i> Usuários
              </div>
            </div>
          </div>

          {/* ================================================================== */}
          {/* SEÇÃO: MÉTODOS DE PAGAMENTO */}
          {/* ================================================================== */}
          <div className="bg-white rounded-2xl p-8 shadow-lg mb-12">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">
              Múltiplas Opções de Pagamento
            </h2>
            <p className="text-gray-600 text-center mb-8 max-w-3xl mx-auto">
              Ofereça diversas formas de pagamento para seus clientes:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-50 rounded-xl p-6 text-center border">
                <i className="fas fa-qrcode text-4xl text-yellow-500 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">PIX</h3>
                <p className="text-gray-600">Pagamento instantâneo</p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6 text-center border">
                <i className="fas fa-store text-4xl text-yellow-500 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Retirada no Local</h3>
                <p className="text-gray-600">Cliente retira na loja</p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6 text-center border">
                <i className="fas fa-hand-holding-usd text-4xl text-yellow-500 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Mercado Pago</h3>
                <p className="text-gray-600">Pagamento parcelado</p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6 text-center border">
                <i className="fas fa-university text-4xl text-yellow-500 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Conta Empresarial</h3>
                <p className="text-gray-600">Transferência direta</p>
              </div>
            </div>
          </div>

          {/* ================================================================== */}
          {/* SEÇÃO: SUPORTE */}
          {/* ================================================================== */}
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-2xl p-8 shadow-xl mb-12">
            <h2 className="text-3xl font-bold text-center mb-6">
              Suporte Contínuo e Especializado
            </h2>
            <p className="text-xl text-center mb-8 max-w-4xl mx-auto">
              Nossa equipe está sempre disponível para ajudar com qualquer dúvida ou problema técnico. 
              Com a mensalidade, você garante:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white bg-opacity-20 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <i className="fas fa-sync-alt mr-3"></i> Atualizações
                </h3>
                <p>Mantenha sempre a versão mais recente e segura do sistema</p>
              </div>
              
              <div className="bg-white bg-opacity-20 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <i className="fas fa-shield-alt mr-3"></i> Segurança
                </h3>
                <p>Proteção contra ameaças e vulnerabilidades</p>
              </div>
              
              <div className="bg-white bg-opacity-20 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <i className="fas fa-cloud mr-3"></i> Hospedagem
                </h3>
                <p>Servidores otimizados para e-commerce</p>
              </div>
              
              <div className="bg-white bg-opacity-20 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <i className="fas fa-headset mr-3"></i> Suporte
                </h3>
                <p>Atendimento rápido para resolver suas dúvidas</p>
              </div>
            </div>
          </div>

          {/* ================================================================== */}
          {/* CALL TO ACTION */}
          {/* ================================================================== */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              Pronto para levar seu negócio para o próximo nível?
            </h2>
            <button 
              onClick={handleAgendarDemonstracao}
              className="btn-cta bg-yellow-500 text-white px-8 py-4 rounded-full text-xl font-bold shadow-lg transition-all duration-300 hover:bg-yellow-600 hover:shadow-xl"
            >
              Agende uma Demonstração Grátis
            </button>
          </div>

          {/* ================================================================== */}
          {/* SEÇÃO: PREÇOS */}
          {/* ================================================================== */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-yellow-500 mb-12">
            <h2 className="text-3xl font-bold text-yellow-600 text-center mb-8">
              Investimento Acessível para Seu Negócio
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-2xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-yellow-500 mb-4">Instalação</h3>
                <div className="text-4xl font-bold text-yellow-500 my-4">Solicite Orçamento</div>
                <p className="text-gray-300 mb-6">Valor único para configuração completa da sua loja</p>
                <ul className="space-y-3 text-gray-300">
                  <li>✓ Configuração personalizada</li>
                  <li>✓ Integração de pagamentos</li>
                  <li>✓ Otimização inicial</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-2xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-yellow-500 mb-4">Mensalidade</h3>
                <div className="text-4xl font-bold text-yellow-500 my-4">Solicite Orçamento</div>
                <p className="text-gray-300 mb-6">Manutenção e suporte contínuo</p>
                <ul className="space-y-3 text-gray-300">
                  <li>✓ Hospedagem profissional</li>
                  <li>✓ Suporte técnico especializado</li>
                  <li>✓ Atualizações de segurança</li>
                  <li>✓ Backups diários</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ================================================================== */}
          {/* RODAPÉ */}
          {/* ================================================================== */}
          <footer className="text-center py-8 border-t border-gray-200">
            <div className="company-info mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Abistec Serviços Tecnológicos Ltda</h3>
              <p className="text-gray-600">CNPJ: 08.087.109/0001-10 | Desde 2006</p>
              <p className="text-gray-600">Especialistas em soluções tecnológicas para e-commerce</p>
            </div>
            <p className="text-gray-500">© 2024 Abistec Serviços Tecnológicos. Todos os direitos reservados.</p>
          </footer>
        </div>
      </div>

      <style jsx>{`
        .text-shadow {
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
        }
        .backdrop-blur-sm {
          backdrop-filter: blur(8px);
        }
      `}</style>
    </>
  );
}