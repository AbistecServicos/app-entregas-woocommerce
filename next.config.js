// next.config.js
const path = require('path');

// ✅ REMOVA o withPWA e use configuração simples
module.exports = {
  // ==========================================================================
  // CONFIGURAÇÕES PARA RESOLVER AVISOS DE MÚLTIPLOS LOCKFILES
  // ==========================================================================
  outputFileTracingRoot: path.join(__dirname, '../'),
  
  // ==========================================================================
  // CONFIGURAÇÕES DO NEXT.JS
  // ==========================================================================
  reactStrictMode: true,
  
  // ==========================================================================
  // CONFIGURAÇÕES PARA MELHORAR PERFORMANCE EM MONOREPO
  // ==========================================================================
  transpilePackages: [],
  
  // ==========================================================================
  // CONFIGURAÇÕES DE WEBPACK
  // ==========================================================================
  webpack: (config, { isServer }) => {
    // ✅ Adicionar suporte para arquivos .js da pasta src/lib
    config.module.rules.push({
      test: /\.(js|jsx)$/,
      include: [path.resolve(__dirname, 'src/lib')],
      use: 'babel-loader',
    });
    
    // ✅ Desativar módulos do Node.js que não são necessários no cliente
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
      };
    }
    return config;
  },
  
  // ==========================================================================
  // CONFIGURAÇÕES DE HEADERS
  // ==========================================================================
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
      {
        source: '/lib/:file*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
        ],
      },
      // ✅ ADICIONE ESTE HEADER PARA O SERVICE WORKER DO FIREBASE
      {
        source: '/firebase-messaging-sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
};