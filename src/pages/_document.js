import Document, { Html, Head, Main, NextScript } from 'next/document';

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
          
          {/* ✅ VIEWPORT REMOVIDO - vai para _app.js */}
          
          {/* Meta tag para Apple devices */}
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="EntregasWoo" />
          <link rel="apple-touch-icon" href="/icon-192x192.png" />

          {/* ====================================================================
           * ÍCONES E FAVICON
           * =================================================================== */}
          
          <link rel="icon" href="/favicon.ico" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          
          {/* ====================================================================
           * FONTES EXTERNAS
           * =================================================================== */}
          
          <link 
            rel="stylesheet" 
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
            integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
          
          <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
          <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />

          {/* ====================================================================
           * META TAGS PARA SEO
           * =================================================================== */}
          
          <meta charSet="UTF-8" />
          <meta 
            name="description" 
            content="Sistema de gestão de entregas e pedidos para comércio eletrônico. Gerencie pedidos, entregadores e relatórios em tempo real." 
          />
          <meta 
            name="keywords" 
            content="entregas, pedidos, ecommerce, gestão, woocommerce, delivery, relatórios" 
          />
          <meta name="author" content="Abistec Serviços Tecnológicos" />
          <meta name="robots" content="index,follow" />
          <link rel="canonical" href="https://www.entregaswoo.com.br" />

          {/* ====================================================================
           * OPEN GRAPH TAGS
           * =================================================================== */}
          
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="EntregasWoo" />
          <meta 
            property="og:description" 
            content="Sistema profissional para gestão de entregas e pedidos de e-commerce" 
          />
          <meta property="og:image" content="/icon-512x512.png" />
          <meta property="og:url" content="https://www.entregaswoo.com.br" />

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
           * PRELOAD DE RECURSOS CRÍTICOS
           * =================================================================== */}
          
          <link 
            rel="preload" 
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2" 
            as="font" 
            type="font/woff2" 
            crossOrigin="anonymous" 
          />
          
          <link rel="dns-prefetch" href="https://fcm.googleapis.com" />
          <link rel="preconnect" href="https://fcm.googleapis.com" />
        </Head>
        
        <body className="bg-gray-50 text-gray-900 antialiased">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;