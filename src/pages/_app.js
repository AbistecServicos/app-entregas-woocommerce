import '../styles/globals.css';
import Layout from '../components/Layout'; // ← Importe o Layout

function MyApp({ Component, pageProps }) {
  // Se for página de login, não usar layout
  if (Component.noLayout) {
    return <Component {...pageProps} />;
  }

  // Para todas outras páginas, usar layout com menu
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;