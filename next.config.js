// next.config.js
// ✅ Importar path para resolver caminhos
const path = require('path');
// ✅ Configurar PWA com next-pwa
const withPWA = require('next-pwa')({
dest: 'public',
register: true,
skipWaiting: true,
disable: process.env.NODE_ENV === 'development', // ✅ Desativa PWA em desenvolvimento
});
module.exports = withPWA({
// ==========================================================================
// CONFIGURAÇÕES PARA RESOLVER AVISOS DE MÚLTIPLOS LOCKFILES
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
// ✅ Adicionar suporte para arquivos .js da pasta src/lib
config.module.rules.push({
test: /.(js|jsx)$/,
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
// ✅ Adicionar header para servir arquivos JavaScript da pasta lib
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
});