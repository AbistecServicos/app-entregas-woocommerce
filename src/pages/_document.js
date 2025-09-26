// pages/_document.js
import Document, { Html, Head, Main, NextScript } from 'next/document';

// ==============================================================================
// CUSTOM DOCUMENT COMPONENT
// ==============================================================================
/**
 * MyDocument é um componente personalizado que estende o Document padrão do Next.js
 * É usado para modificar o HTML e HEAD que envolvem a aplicação
 * 
 * IMPORTANTE: Este arquivo é renderizado apenas no servidor
 * Não use hooks React ou lógica do lado do cliente aqui
 * 
 * Funcionalidades incluídas:
 * - Meta tags para PWA
 * - Ícones e favicon
 * - Fontes externas (Font Awesome)
 * - Estrutura HTML base
 */
class MyDocument extends Document {
  render() {
    return (
      <Html lang="pt-BR">
        <Head>
          {/* ====================================================================
           * CONFIGURAÇÕES PWA (Progressive Web App)
           * =================================================================== */}
          
          {/* Manifest para PWA */}
          <link rel="manifest" href="/manifest.json" />
          
          {/* Meta tag theme-color para a barra de endereço em dispositivos móveis */}
          <meta name="theme-color" content="#8B5CF6" />
          
          {/* Meta tag para Apple devices */}
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="EntregasWoo" />
          <link rel="apple-touch-icon" href="/icon-192x192.png" />

          {/* ====================================================================
           * ÍCONES E FAVICON
           * =================================================================== */}
          
          {/* Favicon tradicional */}
          <link rel="icon" href="/favicon.ico" />
          
          {/* Ícones para diversos dispositivos */}
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          
          {/* ====================================================================
           * FONTES EXTERNAS
           * =================================================================== */}
          
          {/* Font Awesome 6.4.0 - Ícones */}
          <link 
            rel="stylesheet" 
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
            integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
          
          {/* Google Fonts (opcional - descomente se quiser usar) */}
          {/*
          <link
            rel="preconnect"
            href="https://fonts.googleapis.com"
          />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
          */}

          {/* ====================================================================
           * META TAGS PARA SEO
           * =================================================================== */}
          
          {/* Codificação de caracteres */}
          <meta charSet="UTF-8" />
          
          {/* Viewport responsivo (geralmente colocado no _app.js, mas seguro aqui também) */}
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          
          {/* Descrição padrão para SEO */}
          <meta 
            name="description" 
            content="Sistema de gestão de entregas e pedidos para comércio eletrônico. Gerencie pedidos, entregadores e relatórios em tempo real." 
          />
          
          {/* Palavras-chave para SEO */}
          <meta 
            name="keywords" 
            content="entregas, pedidos, ecommerce, gestão, woocommerce, delivery, relatórios" 
          />
          
          {/* Autor */}
          <meta name="author" content="Abistec Serviços Tecnológicos" />

          {/* ====================================================================
           * OPEN GRAPH TAGS (para compartilhamento em redes sociais)
           * =================================================================== */}
          
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="EntregasWoo" />
          <meta 
            property="og:description" 
            content="Sistema profissional para gestão de entregas e pedidos de e-commerce" 
          />
          <meta property="og:image" content="/icon-512x512.png" />

          {/* ====================================================================
           * TWITTER CARD TAGS
           * =================================================================== */}
          
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:creator" content="@abistec" />
          <meta 
            name="twitter:description" 
            content="Sistema profissional para gestão de entregas e pedidos de e-commerce" 
          />
          <meta name="twitter:image" content="/icon-512x512.png" />

          {/* ====================================================================
           * PRELOAD DE RECURSOS CRÍTICOS (opcional)
           * =================================================================== */}
          
          {/* Preload de fontes críticas (exemplo) */}
          {/*
          <link
            rel="preload"
            href="/fonts/critical-font.woff2"
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
          */}
        </Head>
        
        {/* ====================================================================
         * CORPO DO DOCUMENTO
         * =================================================================== */}
        <body className="bg-gray-50 text-gray-900 antialiased">
          {/* 
           * Main: Componente principal da aplicação
           * Todas as páginas são renderizadas dentro deste componente
           */}
          <Main />
          
          {/* 
           * NextScript: Scripts necessários para o Next.js funcionar
           * Inclui runtime, polyfills, etc.
           */}
          <NextScript />
        </body>
      </Html>
    );
  }
}

// ==============================================================================
// EXPORT DEFAULT
// ==============================================================================
export default MyDocument;