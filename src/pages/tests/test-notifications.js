// pages/tests/test-notifications.js
import { useState } from 'react';
import { requestForToken } from '../../../lib/firebase';


export default function TestNotifications() {
  const [token, setToken] = useState(null);

  const handleTestNotification = async () => {
    const t = await requestForToken();
    setToken(t);
    console.log("Token:", t);
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Teste de Notificações</h1>
      <button
        onClick={handleTestNotification}
        style={{ padding: '10px 20px', backgroundColor: '#3b7b2b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        Obter Token
      </button>
      {token && <p>Token: {token}</p>}
    </div>
  );
}
