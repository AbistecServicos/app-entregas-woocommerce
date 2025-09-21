// pages/_app.js (VERSÃO SUPER SIMPLES)
import '../styles/globals.css';
import Layout from '../components/Layout';

function MyApp({ Component, pageProps }) {
  // ✅ Use layout em TODAS as páginas por enquanto
  // Depois ajustamos as exceções
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;