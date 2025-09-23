// src/pages/teste-notificacoes.js
import { useState } from 'react';
import { requestForToken } from '../../lib/firebase'; // ✅ Caminho correto
import { supabase } from '../../lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';

export default function TesteNotificacoes() {
  const [token, setToken] = useState(null);
  const [status, setStatus] = useState('');
  const { userProfile } = useUserProfile();

  const handleTestNotification = async () => {
    try {
      setStatus('Solicitando permissão...');
      
      // Solicitar permissão
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        setStatus('❌ Permissão negada');
        return;
      }

      setStatus('Obtendo token...');
      const currentToken = await requestForToken();
      
      if (!currentToken) {
        setStatus('❌ Não foi possível obter token');
        return;
      }

      setToken(currentToken);
      setStatus('✅ Token obtido!');
      console.log("Token:", currentToken);

    } catch (error) {
      console.error('Erro:', error);
      setStatus('❌ Erro: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Teste de Notificações</h1>
      
      {status && <p>{status}</p>}
      
      <button
        onClick={handleTestNotification}
        style={{ padding: '10px 20px', backgroundColor: '#3b7b2b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        Obter Token
      </button>
      
      {token && (
        <div style={{ marginTop: '20px' }}>
          <p>Token:</p>
          <code style={{ background: '#f5f5f5', padding: '10px', display: 'block', overflowWrap: 'break-word' }}>
            {token}
          </code>
        </div>
      )}
    </div>
  );
}