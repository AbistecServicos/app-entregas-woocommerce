// next.config.js
// ✅ Importar path para resolver caminhos
const path = require('path');

// ✅ Configurar PWA com next-pwa (USE ESTA CONFIGURAÇÃO)
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // ✅ Desativa PWA em desenvolvimento
  
  // ✅ ADICIONE ESTAS NOVAS CONFIGURAÇÕES:
  runtimeCaching: [],
  publicExcludes: ['!noprecache/**/*'],
  buildExcludes: [/middleware-manifest\.json$/]
});

// ✅ MANTENHA TODO O RESTO DO SEU ARQUIVO, apenas mudando a parte PWA
module.exports = withPWA({
  // ==========================================================================
  // CONFIGURAÇÕES PARA RESOLVER AVISOS DE MÚLTIPLOS LOCKFILES
  // ==========================================================================
  outputFileTracingRoot: path.join(__dirname, '../'), // ✅ Define raiz correta
  
  // ==========================================================================
  // CONFIGURAÇÕES DO NEXT.JS (MANTENHA)
  // ==========================================================================
  reactStrictMode: true,
  
  // ==========================================================================
  // CONFIGURAÇÕES PARA MELHORAR PERFORMANCE EM MONOREPO (MANTENHA)
  // ==========================================================================
  transpilePackages: [
    // Adicione aqui os pacotes do seu monorepo que precisam ser transpilados
  ],
  
  // ==========================================================================
  // CONFIGURAÇÕES DE WEBPACK (MANTENHA)
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
  // CONFIGURAÇÕES DE HEADERS (MANTENHA)
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
    ];
  },
  
  // ✅ ADICIONE ESTA NOVA SEÇÃO (OPCIONAL, MAS RECOMENDADO)
  // ==========================================================================
  // CONFIGURAÇÕES ADICIONAIS PARA PWA
  // ==========================================================================
  pwa: {
    scope: '/',
    sw: 'sw.js'
  }
});