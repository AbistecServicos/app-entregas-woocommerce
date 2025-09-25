import { useState, useEffect } from 'react';
import { requestForToken, onMessageListener } from '/lib/firebase';
import { supabase } from '/lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';

export default function TesteNotificacoes() {
  const [token, setToken] = useState(null);
  const [status, setStatus] = useState('Clique em um botão para começar');
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isClient, setIsClient] = useState(false);
  const [tokensBanco, setTokensBanco] = useState([]);
  const [ultimaNotificacao, setUltimaNotificacao] = useState(null);
  const { userProfile } = useUserProfile();

  useEffect(() => {
    setIsClient(true);
    setNotificationPermission(Notification.permission);
    verificarServiceWorker();
    escutarNotificacoes();
  }, []);

  const verificarServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        console.log('✅ Service Worker registrado:', registration);
        setStatus(prev => prev + '\n✅ Service Worker OK');
      } catch (err) {
        console.error('❌ Erro no Service Worker:', err);
        setStatus(prev => prev + '\n❌ Service Worker falhou');
      }
    } else {
      setStatus(prev => prev + '\n❌ Service Worker não suportado');
    }
  };

  const escutarNotificacoes = () => {
    onMessageListener()
      .then((payload) => {
        console.log('📩 Notificação recebida em foreground:', payload);
        setUltimaNotificacao(payload);
        setStatus(prev => prev + `\n📩 Nova notificação: ${payload.notification?.title}`);
        
        if (payload.notification && Notification.permission === 'granted') {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png'
          });
        }
      })
      .catch((error) => {
        console.log('❌ Erro no listener:', error);
      });
  };

  const salvarTokenNoBanco = async (token) => {
    try {
      if (!userProfile?.uid) {
        throw new Error('Usuário não logado');
      }

      const { error } = await supabase
        .from('user_tokens')
        .upsert(
          { 
            user_id: userProfile.uid, 
            token: token,
            updated_at: new Date().toISOString() 
          },
          { 
            onConflict: 'user_id,token',
            ignoreDuplicates: false 
          }
        );

      if (error) {
        console.error('Erro detalhado:', error);
        if (error.code === '23505') {
          console.log('✅ Token já existia (atualizado timestamp)');
          return true;
        }
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar token:', error);
      return false;
    }
  };

  const handleObterToken = async () => {
    try {
      setStatus('🔐 Solicitando permissão...');
      
      if (!isClient) {
        throw new Error('Aguardando carregamento do navegador');
      }

      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission !== 'granted') {
        throw new Error('Permissão negada pelo usuário');
      }

      setStatus('🔑 Obtendo token FCM...');
      const currentToken = await requestForToken();
      
      if (!currentToken) {
        throw new Error('Não foi possível gerar o token FCM');
      }

      setToken(currentToken);
      setStatus('💾 Salvando token no banco...');
      
      const salvou = await salvarTokenNoBanco(currentToken);
      
      if (salvou) {
        setStatus('✅ Token obtido e salvo com sucesso!');
      } else {
        setStatus('⚠️ Token obtido, mas houve um problema ao salvar (pode já existir)');
      }
      
      await verificarTokensBanco();

    } catch (error) {
      console.error('Erro:', error);
      setStatus(`❌ Erro: ${error.message}`);
    }
  };

const testarNotificacaoSupabase = async () => {
  try {
    setStatus('🐛 Iniciando debug detalhado...');
    
    // DEBUG 1: Verificar usuário
    console.log('=== DEBUG 1 - USUÁRIO ===');
    console.log('👤 User ID:', userProfile?.uid);
    console.log('👤 User Profile completo:', userProfile);
    
    if (!userProfile?.uid) {
      throw new Error('Usuário não logado ou ID não disponível');
    }

    // DEBUG 2: Buscar tokens no banco
    setStatus('🔍 Buscando tokens no banco...');
    console.log('=== DEBUG 2 - BUSCA NO BANCO ===');
    
    const { data: tokens, error: tokensError } = await supabase
      .from('user_tokens')
      .select('id, user_id, token, created_at')
      .eq('user_id', userProfile.uid);

    console.log('📋 Resultado da query:', { 
      tokens, 
      tokensError,
      query: `SELECT * FROM user_tokens WHERE user_id = '${userProfile.uid}'`
    });

    if (tokensError) {
      console.error('❌ Erro na query:', tokensError);
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      setStatus('❌ Nenhum token encontrado para este usuário');
      console.log('⚠️ Nenhum token encontrado para user_id:', userProfile.uid);
      
      // Debug: ver todos os tokens da tabela
      const { data: todosTokens } = await supabase
        .from('user_tokens')
        .select('user_id, token')
        .limit(5);
      console.log('📊 Primeiros 5 tokens da tabela:', todosTokens);
      
      return;
    }

    // DEBUG 3: Processar tokens
    console.log('=== DEBUG 3 - PROCESSANDO TOKENS ===');
    const fcmTokens = tokens.map(t => t.token);
    console.log('🎯 Tokens extraídos:', fcmTokens);
    console.log('🔢 Quantidade de tokens:', fcmTokens.length);

    // DEBUG 4: Montar payload
    const payload = {
      title: "🎉 Teste de Notificação!",
      body: "Esta é uma notificação de teste do sistema!",
      fcmTokens: fcmTokens,
      data: { 
        tipo: "teste", 
        userId: userProfile.uid,
        timestamp: new Date().toISOString(),
        url: "/pedidos-pendentes"
      }
    };

    console.log('=== DEBUG 4 - PAYLOAD ENVIADO ===');
    console.log('📤 Payload completo:', JSON.stringify(payload, null, 2));
    console.log('🔍 fcmTokens no payload:', payload.fcmTokens);
    console.log('🔢 Tipo de fcmTokens:', typeof payload.fcmTokens);
    console.log('🔢 É array?', Array.isArray(payload.fcmTokens));

    // DEBUG 5: Chamar a função
    setStatus('📨 Chamando Edge Function...');
    console.log('=== DEBUG 5 - CHAMANDO FUNÇÃO ===');
    
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: payload
    });

    console.log('=== DEBUG 6 - RESPOSTA DA FUNÇÃO ===');
    console.log('📥 Resposta completa:', { data, error });
    
    if (error) {
      console.error('❌ Erro na chamada:', error);
      console.log('🔍 Status do erro:', error.status);
      console.log('🔍 Mensagem do erro:', error.message);
      console.log('🔍 Contexto do erro:', error.context);
      
      throw error;
    }

    setStatus(`✅ Sucesso! Notificação enviada para ${fcmTokens.length} dispositivo(s)`);
    console.log('🎉 Notificação enviada com sucesso!', data);

  } catch (error) {
    console.error('💥 ERRO FINAL:', error);
    setStatus(`❌ Erro: ${error.message}`);
    
    // Debug adicional do erro
    if (error.message.includes('Lista de tokens FCM é obrigatória')) {
      setStatus(prev => prev + '\n⚠️ A função não está recebendo os tokens corretamente');
    }
  }
};

  const verificarTokensBanco = async () => {
    try {
      const { data, error } = await supabase
        .from('user_tokens')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      setTokensBanco(data || []);
      return data;
    } catch (error) {
      console.error('Erro:', error);
      throw error;
    }
  };

  // 🔍 AQUI ESTÁ A FUNÇÃO debugTokens - COLOQUEI ANTES DA testarNotificacaoLocal
  const debugTokens = async () => {
    try {
      setStatus('🔍 Debugando tokens...');
      
      const { data: tokens, error } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', userProfile?.uid);

      if (error) throw error;
      
      setStatus(`🔍 Debug: ${tokens?.length || 0} tokens para usuário ${userProfile?.uid}`);
      console.log('Tokens do usuário:', tokens);
      
    } catch (error) {
      setStatus(`❌ Debug error: ${error.message}`);
    }
  };

  const testarNotificacaoLocal = () => {
    if (!isClient || notificationPermission !== 'granted') {
      setStatus('❌ Permissão não concedida');
      return;
    }

    new Notification('🔔 Teste Local', {
      body: 'Esta notificação foi gerada localmente no navegador!',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'teste-local',
      data: { tipo: 'local', timestamp: new Date().toISOString() }
    });
    
    setStatus('✅ Notificação local enviada!');
  };

  const limparTokens = async () => {
    try {
      if (!userProfile?.uid) {
        throw new Error('Usuário não logado');
      }

      const { error } = await supabase
        .from('user_tokens')
        .delete()
        .eq('user_id', userProfile.uid);

      if (error) throw error;

      setToken(null);
      setTokensBanco([]);
      setStatus('✅ Tokens do usuário removidos!');
    } catch (error) {
      console.error('Erro:', error);
      setStatus(`❌ Erro ao limpar tokens: ${error.message}`);
    }
  };

  const buttonStyle = {
    padding: '12px 20px',
    backgroundColor: '#3b7b2b',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    margin: '5px',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    minWidth: '180px'
  };

  const buttonStyleSecondary = {
    ...buttonStyle,
    backgroundColor: '#6b7280'
  };

  const buttonStyleDanger = {
    ...buttonStyle,
    backgroundColor: '#dc2626'
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: '#1f2937',
        marginBottom: '30px'
      }}>
        🔔 Painel de Teste de Notificações
      </h1>

      {/* Status em tempo real */}
      <div style={{
        backgroundColor: '#f8fafc',
        padding: '20px',
        borderRadius: '10px',
        margin: '20px 0',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ marginTop: 0, color: '#374151' }}>📋 Status do Sistema</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px',
          marginBottom: '15px'
        }}>
          <div><strong>Usuário:</strong> {userProfile?.uid ? '✅ Logado' : '❌ Não logado'}</div>
          <div><strong>Permissão:</strong> 
            <span style={{ 
              color: notificationPermission === 'granted' ? '#10b981' : 
                     notificationPermission === 'denied' ? '#ef4444' : '#f59e0b'
            }}>
              {notificationPermission}
            </span>
          </div>
          <div><strong>Service Worker:</strong> {isClient && 'serviceWorker' in navigator ? '✅' : '❌'}</div>
          <div><strong>Token FCM:</strong> {token ? '✅' : '❌'}</div>
        </div>

        {/* Área de logs */}
        <div style={{
          backgroundColor: 'white',
          padding: '15px',
          borderRadius: '5px',
          border: '1px solid #e5e7eb',
          fontFamily: 'monospace',
          fontSize: '14px',
          whiteSpace: 'pre-wrap',
          minHeight: '100px',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {status}
        </div>
      </div>

      {/* Botões de ação - AQUI ADICIONE O BOTÃO DEBUG */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '10px',
        margin: '20px 0'
      }}>
        <button onClick={handleObterToken} style={buttonStyle}>
          🚀 1. Obter Token FCM
        </button>
        <button onClick={testarNotificacaoSupabase} style={buttonStyle} disabled={!token}>
          📨 2. Testar Notificação
        </button>
        <button onClick={testarNotificacaoLocal} style={buttonStyle} 
                disabled={!isClient || notificationPermission !== 'granted'}>
          🔔 3. Teste Local
        </button>
        <button onClick={() => verificarTokensBanco().then(data => 
          setStatus(`📊 ${data?.length || 0} tokens no banco`))} 
                style={buttonStyleSecondary}>
          📊 4. Verificar Banco
        </button>
        
        {/* 🔍 BOTÃO DEBUG ADICIONADO AQUI */}
        <button onClick={debugTokens} style={buttonStyleSecondary}>
          🐛 5. Debug Tokens
        </button>
        
        <button onClick={limparTokens} style={buttonStyleDanger} disabled={!userProfile?.uid}>
          🗑️ 6. Limpar Tokens
        </button>
      </div>

      {/* Token atual */}
      {token && (
        <div style={{
          backgroundColor: '#dbeafe',
          padding: '15px',
          borderRadius: '8px',
          margin: '15px 0'
        }}>
          <h3 style={{ marginTop: 0, color: '#1e40af' }}>🔑 Token FCM Atual</h3>
          <code style={{
            display: 'block',
            background: '#eff6ff',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            wordBreak: 'break-all',
            border: '1px solid #bfdbfe'
          }}>
            {token}
          </code>
        </div>
      )}

      {/* Última notificação recebida */}
      {ultimaNotificacao && (
        <div style={{
          backgroundColor: '#f0fdf4',
          padding: '15px',
          borderRadius: '8px',
          margin: '15px 0',
          border: '1px solid #bbf7d0'
        }}>
          <h3 style={{ marginTop: 0, color: '#166534' }}>📩 Última Notificação</h3>
          <pre style={{
            background: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            overflow: 'auto',
            border: '1px solid #dcfce7'
          }}>
            {JSON.stringify(ultimaNotificacao, null, 2)}
          </pre>
        </div>
      )}

      {/* Tokens no banco */}
      {tokensBanco.length > 0 && (
        <div style={{
          backgroundColor: '#faf5ff',
          padding: '15px',
          borderRadius: '8px',
          margin: '15px 0'
        }}>
          <h3 style={{ marginTop: 0, color: '#7c3aed' }}>💾 Tokens no Banco ({tokensBanco.length})</h3>
          <div style={{ fontSize: '12px' }}>
            {tokensBanco.slice(0, 5).map((tokenItem, index) => (
              <div key={tokenItem.id} style={{ 
                marginBottom: '5px', 
                padding: '5px',
                background: 'white',
                borderRadius: '3px'
              }}>
                <strong>#{index + 1}:</strong> {tokenItem.token.substring(0, 50)}...
              </div>
            ))}
            {tokensBanco.length > 5 && <div>... e mais {tokensBanco.length - 5} tokens</div>}
          </div>
        </div>
      )}
    </div>
  );
}