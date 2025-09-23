// src/pages/_app.js
import { useEffect } from 'react';
import '../styles/globals.css';
import Layout from '../components/Layout';

function MyApp({ Component, pageProps }) {
  // ✅ REGISTRAR SERVICE WORKER
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registrado:', registration);
        })
        .catch((error) => {
          console.error('❌ Erro no Service Worker:', error);
        });
    }
  }, []);

  // ✅ Use layout em todas as páginas
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;