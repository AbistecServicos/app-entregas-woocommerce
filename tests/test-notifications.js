// 1. IMPORTAÇÕES
// Importação de dependências básicas do React
import { useEffect } from 'react';

// 2. COMPONENTE DE TESTE
// Componente simples para testar notificações
export default function TestNotifications() {
  // 3. HOOK USEEFFECT
  // Carrega o script firebase.js dinamicamente
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/firebase.js';
    script.type = 'module';
    script.async = true;
    document.body.appendChild(script);

    // Cleanup ao desmontar o componente
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // 4. RETORNO JSX
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Teste de Notificações</h1>
      {/* 5. BOTÃO DE TESTE (PROVISÓRIO)
      - Botão para testar a obtenção de token. Remova após testes. */}
      <button
        onClick={() => {
          if (window.requestForToken) {
            window.requestForToken().then(token => console.log('Token:', token)).catch(error => console.error('Erro:', error));
          } else {
            console.error('requestForToken não está disponível. Aguarde o carregamento do script.');
          }
        }}
        style={{ padding: '10px 20px', backgroundColor: '#3b7b2b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        Testar Notificação
      </button>
    </div>
  );
}