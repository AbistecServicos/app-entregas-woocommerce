// next.config.js
const path = require('path'); // ✅ Importar path para resolver caminhos
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // ✅ Desativa PWA em desenvolvimento
});

module.exports = withPWA({
  // ==========================================================================
  // CONFIGURAÇÕES PARA RESOLVER AVISOS DE MULTIPLOS LOCKFILES
  // ==========================================================================
  outputFileTracingRoot: path.join(__dirname, '../'), // ✅ Define raiz correta
  
  // ==========================================================================
  // CONFIGURAÇÕES DO NEXT.JS
  // ==========================================================================
  reactStrictMode: true,
  
  // ==========================================================================
  // CONFIGURAÇÕES PARA MELHORAR PERFORMANCE EM MONOREPO
  // ==========================================================================
  transpilePackages: [
    // Adicione aqui os pacotes do seu monorepo que precisam ser transpilados
    // Exemplo: '@meu-projeto/shared', '@meu-projeto/utils'
  ],
  
  // ==========================================================================
  // CONFIGURAÇÕES DE WEBPACK (OPCIONAL - para otimização)
  // ==========================================================================
  webpack: (config, { isServer }) => {
    // Configurações personalizadas do Webpack se necessário
    return config;
  },
  
  // ==========================================================================
  // CONFIGURAÇÕES DE HEADERS (para manifest.json)
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
    ];
  },
});
