// pages/_app.js
import '../styles/globals.css';
import Layout from '../components/Layout';

// ==============================================================================
// COMPONENTE MyApp - PONTO DE ENTRADA DA APLICAÇÃO
// ==============================================================================
/**
 * MyApp é o componente raiz que envolve todas as páginas
 * Aqui definimos layouts globais, providers e configurações comuns
 * 
 * @param {Object} props - Propriedades do Next.js
 * @param {React.Component} props.Component - Componente da página atual
 * @param {Object} props.pageProps - Props específicas da página
 */
function MyApp({ Component, pageProps }) {
  
  // ============================================================================
  // 1. DECISÃO DE LAYOUT POR PÁGINA
  // ============================================================================
  /**
   * Estratégia: Cada página pode definir se quer ou não o layout padrão
   * através da propriedade estática `noLayout`
   * 
   * Páginas que devem SEM layout:
   * - Login, Cadastro, Erros, Admin (porque tem layout próprio)
   */
  
  // Verificar se a página atual deve usar layout
  const shouldUseLayout = !Component.noLayout;

  // ============================================================================
  // 2. RENDERIZAÇÃO CONDICIONAL
  // ============================================================================
  return (
    <>
      {shouldUseLayout ? (
        // PÁGINAS COM LAYOUT PADRÃO (com sidebar e header)
        <Layout>
          <Component {...pageProps} />
        </Layout>
      ) : (
        // PÁGINAS SEM LAYOUT PADRÃO (renderizar apenas o conteúdo)
        <Component {...pageProps} />
      )}
    </>
  );
}

export default MyApp;