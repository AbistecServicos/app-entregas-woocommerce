// Importação de dependências necessárias do Next.js e React
import Head from 'next/head';
import Link from 'next/link';
import { useEffect } from 'react';

// Componente principal da página inicial
export default function HomePage() {
  // Hook useEffect para configurar a navegação suave
  useEffect(() => {
    // Seleção de todos os links internos que começam com '#'
    const anchors = document.querySelectorAll('a[href^="#"]');

    // Função para lidar com o clique em links internos
    const handleAnchorClick = (e) => {
      e.preventDefault();
      const targetId = e.currentTarget.getAttribute('href');

      // Verifica se o link não é apenas '#'
      if (targetId === '#') return;

      // Encontra o elemento alvo pelo ID
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        // Realiza a rolagem suave com offset para compensar o cabeçalho
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Ajuste de 80px para o cabeçalho
          behavior: 'smooth'
        });
      }
    };

    // Adiciona event listeners para todos os links internos
    anchors.forEach(anchor => {
      anchor.addEventListener('click', handleAnchorClick);
    });

    // Cleanup: remove os event listeners quando o componente é desmontado
    return () => {
      anchors.forEach(anchor => {
        anchor.removeEventListener('click', handleAnchorClick);
      });
    };
  }, []);

  return (
    <>
      {/* ✅ CORREÇÃO: Removido Font Awesome do Head - Agora está no _document.js */}
      <Head>
        <title>VendasWoo + EntregasWoo - Sistema Completo para E-commerce e Entregas</title>
        {/* ❌ REMOVIDO: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" /> */}
        
        {/* ✅ Viewport para responsividade */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      {/* Cabeçalho da página com apenas o título */}
      <header>
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <h1>VendasWoo <span>+ EntregasWoo</span></h1>
            </div>
          </div>
        </div>
      </header>

      {/* Seção Hero com chamada principal */}
      <section className="hero">
        <div className="container">
          <h2>Sistema Completo para E-commerce e Entregas</h2>
          <p>Conectamos lojas a entregadores locais para simplificar e agilizar as entregas na sua região.</p>
          <div className="hero-buttons">
            <Link href="#para-lojas" className="btn">Sou Lojista</Link>
            <Link href="#para-entregadores" className="btn btn-accent">Sou Entregador</Link>
            <a href="https://wa.me/552132727548" className="btn btn-outline" target="_blank" rel="noopener noreferrer">Fale no WhatsApp</a>
          </div>
        </div>
      </section>

      {/* Seção Como Funciona com passos para entregadores e lojas */}
      <section className="how-it-works" id="como-funciona">
        <div className="container">
          <div className="section-title">
            <h2>Como Funciona</h2>
            <p>Dois sistemas integrados para atender lojas e entregadores</p>
          </div>
          
          <div className="dual-steps">
            <div className="steps-container">
              <h3 className="steps-title">Para Entregadores</h3>
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Cadastro Simplificado</h4>
                  <p>Faça seu cadastro como motorista autônomo MEI com documentação em ordem.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Defina sua Área de Atuação</h4>
                  <p>Informe seu veículo, capacidade de carga e o perímetro onde quer trabalhar.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Conexão com Lojas</h4>
                  <p>Conectamos você às empresas que precisam de entregas na sua região.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>Combine Preços e Área</h4>
                  <p>Negocie diretamente com as lojas os valores e detalhes do serviço.</p>
                </div>
              </div>
            </div>
            
            <div className="steps-container">
              <h3 className="steps-title">Para Lojas</h3>
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Plataforma Completa</h4>
                  <p>Tenha seu e-commerce com catálogo de produtos, atualização de preços fácil e múltiplas formas de pagamento.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Integração Total</h4>
                  <p>Receba pedidos pelo app, computador e WhatsApp integrados em um único sistema.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Gestão Completa</h4>
                  <p>Controle de estoque, relatórios, emissão de recibos e muito mais.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>Entregas Terceirizadas</h4>
                  <p>Use o EntregasWoo para conectar-se a entregadores de bairro e terceirizar suas entregas.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Para Lojas com benefícios */}
      <section id="para-lojas" className="benefits">
        <div className="container">
          <div className="section-title">
            <h2>Para Lojas e Empresas</h2>
            <p>Sistema completo para vendas online e gestão de entregas</p>
          </div>
          <ul className="benefits-list">
            <li>Plataforma online para apresentar seus produtos de forma profissional</li>
            <li>Atualização de preços fácil e intuitiva</li>
            <li>Múltiplas formas de pagamento integradas (PIX, cartão, etc)</li>
            <li>Recebimento de pedidos por app, computador e WhatsApp</li>
            <li>Controle de estoque em tempo real</li>
            <li>Relatórios detalhados de vendas e desempenho</li>
            <li>Emissão de recibos e comprovantes</li>
            <li>App EntregasWoo para terceirizar entregas para motoristas de bairro</li>
            <li>Gestão integrada de pedidos e entregas em um único sistema</li>
          </ul>
          <div style={{textAlign: 'center', marginTop: '30px'}}>
            <a href="https://wa.me/552132727548?text=Gostaria de saber mais sobre o sistema para lojas" className="btn">Quero saber mais</a>
          </div>
        </div>
      </section>

      {/* Seção Para Entregadores com benefícios */}
      <section id="para-entregadores" className="benefits" style={{backgroundColor: 'var(--light-gray)'}}>
        <div className="container">
          <div className="section-title">
            <h2>Para Entregadores</h2>
            <p>Conecte-se com lojas da sua região e aumente sua renda</p>
          </div>
          <ul className="benefits-list">
            <li>Cadastro gratuito para motoristas MEI com documentação regular</li>
            <li>Defina o tipo de veículo, capacidade de carga e área de atuação</li>
            <li>Escolha o perímetro onde quer trabalhar (bairros, regiões)</li>
            <li>Conexão direta com empresas que precisam de entregas na sua área</li>
            <li>Negociação direta de preços e condições de serviço</li>
            <li>Flexibilidade de horários - trabalhe quando quiser</li>
            <li>App simples para gerenciar corridas e ganhos</li>
            <li>Pagamentos rápidos e transparentes</li>
            <li>Construa sua reputação com avaliações das lojas</li>
          </ul>
          <div style={{textAlign: 'center', marginTop: '30px'}}>
            <a href="https://wa.me/552132727548?text=Gostaria de me cadastrar como entregador" className="btn btn-accent">Quero me cadastrar</a>
          </div>
        </div>
      </section>

      {/* Seção de Chamada para Ação (CTA) */}
      <section className="cta">
        <div className="container">
          <h2>Pronto para transformar seu negócio ou aumentar sua renda?</h2>
          <p>Entre em contato e faça um teste grátis dos nossos sistemas</p>
          <a href="https://wa.me/552132727548" className="btn" target="_blank" rel="noopener noreferrer">Fale conosco no WhatsApp</a>
        </div>
      </section>

      {/* Rodapé com links rápidos e informações de contato */}
      <footer id="contato">
        <div className="container">
          <div className="footer-content">
            <div className="footer-column">
              <h3>VendasWoo + EntregasWoo</h3>
              <p>Sistema integrado de e-commerce e gestão de entregas</p>
            </div>
            <div className="footer-column">
              <h3>Links Rápidos</h3>
              <ul>
                <li><Link href="#como-funciona">Como Funciona</Link></li>
                <li><Link href="#para-lojas">Para Lojas</Link></li>
                <li><Link href="#para-entregadores">Para Entregadores</Link></li>
                <li><a href="https://www.entregaswoo.com.br/" target="_blank" rel="noopener noreferrer">VendasWoo</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Contato</h3>
              <ul>
                <li>Email: comercial@abistec.com.br</li>
                <li>WhatsApp: (21) 3272-7548</li>
                <li>Site: <a href="https://pedidossimples.com.br">pedidossimples.com.br</a></li>
              </ul>
            </div>
          </div>
          <div className="copyright">
            <p>&copy; 2023 VendasWoo + EntregasWoo - Abistec Serviços Tecnológicos Ltda</p>
          </div>
        </div>
      </footer>

      {/* Estilos globais usando styled-jsx */}
      <style jsx global>{`
        :root {
          --primary: #3b7b2b;
          --secondary: #5c3b27;
          --accent: #f39c12;
          --light: #fdfaf6;
          --dark: #333;
          --gray: #777;
          --light-gray: #f5f5f5;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
          background-color: var(--light);
          color: var(--dark);
          line-height: 1.6;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        /* Estilos do Cabeçalho */
        header {
          background-color: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          /* Removido o comportamento sticky para fluir com a rolagem */
        }
        
        .header-content {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 15px 0;
        }
        
        .logo {
          display: flex;
          align-items: center;
        }
        
        .logo h1 {
          color: var(--primary);
          font-size: 1.8rem;
          font-weight: bold;
        }
        
        .logo span {
          color: var(--secondary);
        }
        
        nav ul {
          display: flex;
          list-style: none;
        }
        
        nav li {
          margin-left: 25px;
        }
        
        nav a {
          text-decoration: none;
          color: var(--dark);
          font-weight: 500;
          transition: color 0.3s;
        }
        
        nav a:hover {
          color: var(--primary);
        }
        
        .btn {
          display: inline-block;
          padding: 12px 25px;
          background-color: var(--primary);
          color: white;
          border-radius: 5px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s;
          border: none;
          cursor: pointer;
        }
        
        .btn:hover {
          background-color: #2c5e20;
          transform: translateY(-2px);
        }
        
        .btn-outline {
          background-color: transparent;
          border: 2px solid var(--primary);
          color: var(--primary);
        }
        
        .btn-outline:hover {
          background-color: var(--primary);
          color: white;
        }
        
        .btn-accent {
          background-color: var(--accent);
        }
        
        .btn-accent:hover {
          background-color: #e67e22;
        }
        
        /* Estilos da Seção Hero */
        .hero {
          padding: 80px 0;
          background: linear-gradient(135deg, rgba(59,123,43,0.1) 0%, rgba(92,59,39,0.1) 100%);
          text-align: center;
        }
        
        .hero h2 {
          font-size: 2.5rem;
          margin-bottom: 20px;
          color: var(--secondary);
        }
        
        .hero p {
          font-size: 1.2rem;
          max-width: 800px;
          margin: 0 auto 30px;
          color: var(--gray);
        }
        
        .hero-buttons {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 30px;
          flex-wrap: wrap;
        }
        
        /* Estilos da Seção Como Funciona */
        .how-it-works {
          padding: 80px 0;
          background-color: var(--light-gray);
        }
        
        .section-title {
          text-align: center;
          margin-bottom: 50px;
        }
        
        .section-title h2 {
          font-size: 2rem;
          color: var(--secondary);
          margin-bottom: 15px;
        }
        
        .section-title p {
          color: var(--gray);
          max-width: 700px;
          margin: 0 auto;
        }
        
        .dual-steps {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 40px;
        }
        
        .steps-container {
          flex: 1;
          min-width: 300px;
          background: white;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
        
        .steps-title {
          text-align: center;
          margin-bottom: 30px;
          color: var(--primary);
          font-size: 1.5rem;
        }
        
        .step {
          display: flex;
          margin-bottom: 25px;
          align-items: flex-start;
        }
        
        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin-right: 15px;
          flex-shrink: 0;
        }
        
        .step-content {
          flex: 1;
        }
        
        /* Estilos da Seção Benefícios */
        .benefits {
          padding: 80px 0;
          background-color: white;
        }
        
        .benefits-list {
          list-style: none;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .benefits-list li {
          padding: 15px 0;
          border-bottom: 1px solid #eee;
          display: flex;
          align-items: center;
        }
        
        .benefits-list li:before {
          content: "✓";
          color: var(--primary);
          font-weight: bold;
          margin-right: 10px;
          font-size: 1.2rem;
        }
        
        /* Estilos da Seção CTA */
        .cta {
          padding: 80px 0;
          background: linear-gradient(135deg, var(--primary) 0%, #2c5e20 100%);
          color: white;
          text-align: center;
        }
        
        .cta h2 {
          font-size: 2.2rem;
          margin-bottom: 20px;
        }
        
        .cta p {
          max-width: 700px;
          margin: 0 auto 30px;
          font-size: 1.1rem;
        }
        
        .cta .btn {
          background-color: white;
          color: var(--primary);
        }
        
        .cta .btn:hover {
          background-color: #f0f0f0;
        }
        
        /* Estilos do Rodapé */
        footer {
          background-color: var(--secondary);
          color: white;
          padding: 50px 0 20px;
        }
        
        .footer-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 30px;
          margin-bottom: 30px;
        }
        
        .footer-column h3 {
          margin-bottom: 20px;
          font-size: 1.2rem;
        }
        
        .footer-column ul {
          list-style: none;
        }
        
        .footer-column li {
          margin-bottom: 10px;
        }
        
        .footer-column a {
          color: #ddd;
          text-decoration: none;
          transition: color 0.3s;
        }
        
        .footer-column a:hover {
          color: white;
        }
        
        .copyright {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.1);
          font-size: 0.9rem;
          color: #ddd;
        }
        
        /* Estilos Responsivos */
        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
          }
          
          .hero h2 {
            font-size: 2rem;
          }
          
          .hero-buttons {
            flex-direction: column;
            align-items: center;
          }
          
          .dual-steps {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}