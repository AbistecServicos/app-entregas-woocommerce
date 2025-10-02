// ========================================
// _DOCUMENT.JS - CUSTOM DOCUMENT OTIMIZADO
// ========================================
// Descrição: Configura HTML/Head server-side (PWA, SEO, icons, fonts).
// Integração: Suporta FCM SW (preload); SEO para app entregas.
// Melhoria: Viewport adicionado; prefetch FCM; canonical/robots.
// Manutenção: Seções numeradas. Alinha PDF (não afeta chaves; acelera compat HS256).
// ========================================

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
          
          {/* ✅ VIEWPORT ADICIONADO: Essencial para mobile responsiveness */}
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          
          {/* Meta tag para Apple devices */}
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="EntregasWoo" />
          <link rel="apple-touch-icon" href="/icon-192x192.png" />
          {/* Splash para iOS */}
          <link rel="apple-touch-startup-image" href="/splash.png" />

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
          
          {/* Font Awesome - SEM WARNING (integrity + preconnect) */}
          <link 
            rel="stylesheet" 
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
            integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
          
          {/* Pré-conexão para performance */}
          <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
          <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />

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

          {/* ✅ ROBOTS + CANONICAL: Para indexação e evitar duplicates */}
          <meta name="robots" content="index,follow" />
          <link rel="canonical" href="https://www.entregaswoo.com.br" /> {/* Ajuste URL base */}

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
          <meta property="og:url" content="https://www.entregaswoo.com.br" /> {/* Dinâmico se precisar */}

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
          <meta name="twitter:title" content="EntregasWoo - Gestão de Entregas" />

          {/* ====================================================================
           * PRELOAD DE RECURSOS CRÍTICOS (OTIMIZADO)
           * =================================================================== */}
          
          {/* Preload Font Awesome (critical para icons no sino) */}
          <link 
            rel="preload" 
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2" 
            as="font" 
            type="font/woff2" 
            crossOrigin="anonymous" 
          />
          
          {/* Preload FCM para notificações rápidas (PDF compat) */}
          <link rel="dns-prefetch" href="https://fcm.googleapis.com" />
          <link rel="preconnect" href="https://fcm.googleapis.com" />

          {/* Preload de fontes críticas (exemplo - descomente se usar) */}
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
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;