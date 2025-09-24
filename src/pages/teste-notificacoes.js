// src/pages/teste-notificacoes.js - ATUALIZADO
import { useState, useEffect } from 'react';
import { requestForToken } from '../../lib/firebase';
import { supabase } from '../../lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';

export default function TesteNotificacoes() {
  const [token, setToken] = useState(null);
  const [status, setStatus] = useState('');
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isClient, setIsClient] = useState(false);
  const { userProfile } = useUserProfile();

  useEffect(() => {
    setIsClient(true);
    setNotificationPermission(Notification.permission);
  }, []);

  // ✅ SALVAR TOKEN NO BANCO (CORRIGIDO)
  const salvarTokenNoBanco = async (token) => {
    try {
      // ✅ PRIMEIRO TENTA INSERIR SIMPLESMENTE
      const { error } = await supabase
        .from('user_tokens')
        .insert({
          user_id: userProfile?.uid || 'usuario-teste',
          token: token,
          updated_at: new Date().toISOString()
        });

      if (error) {
        // ✅ SE DER ERRO DE DUPLICATA, TENTA UPDATE
        if (error.code === '23505') {
          const { error: updateError } = await supabase
            .from('user_tokens')
            .update({ updated_at: new Date().toISOString() })
            .eq('user_id', userProfile?.uid || 'usuario-teste')
            .eq('token', token);

          if (updateError) {
            console.error('Erro ao atualizar token:', updateError);
            return false;
          }
          return true;
        }
        console.error('Erro ao salvar token:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Erro database:', error);
      return false;
    }
  };

  // ✅ OBTER TOKEN FCM
  const handleTestNotification = async () => {
    try {
      setStatus('Solicitando permissão...');
      
      if (!isClient) {
        setStatus('❌ Aguardando carregamento do navegador...');
        return;
      }
      
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
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
      setStatus('✅ Token obtido! Salvando no banco...');
      
      const salvou = await salvarTokenNoBanco(currentToken);
      if (salvou) {
        setStatus('✅ Token salvo no banco!');
      } else {
        setStatus('✅ Token obtido, mas erro ao salvar no banco');
      }

    } catch (error) {
      console.error('Erro:', error);
      setStatus('❌ Erro: ' + error.message);
    }
  };

  // ✅ TESTAR NOTIFICAÇÃO VIA EDGE FUNCTION (CORRIGIDO)
  const testarEdgeFunction = async () => {
    try {
      setStatus('Enviando notificação via Supabase...');
      
      // ✅ VERIFICAR SE O TOKEN ESTÁ NO BANCO PRIMEIRO
      const { data: tokens } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', userProfile?.uid || 'usuario-teste');

      if (!tokens || tokens.length === 0) {
        setStatus('❌ Nenhum token encontrado no banco. Use o botão 1 primeiro.');
        return;
      }

      const functionUrl = 'https://czzidhzzpqegfvvmdgno.supabase.co/functions/v1/send-notification';
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          title: "🎉 Teste de Notificação Push!",
          body: "Esta notificação veio do Supabase Edge Function!",
          userId: userProfile?.uid || 'usuario-teste',
          data: { 
            tipo: "teste",
            url: "/teste-notificacoes"
          }
        })
      });
      
      if (response.status === 404) {
        setStatus('❌ Edge Function não encontrada (404). Verifique o nome.');
        return;
      }
      
      const result = await response.json();
      console.log('Resposta do Supabase:', result);
      
      if (result.success) {
        setStatus('✅ Notificação enviada via Supabase!');
      } else {
        setStatus('❌ Erro no Supabase: ' + (result.error || 'Desconhecido'));
      }
      
    } catch (error) {
      console.error('Erro:', error);
      setStatus('❌ Erro ao chamar Edge Function: ' + error.message);
    }
  };

  // ✅ VERIFICAR TOKENS NO BANCO
  const verificarTokensBanco = async () => {
    try {
      const { data, error } = await supabase
        .from('user_tokens')
        .select('*');
      
      if (error) {
        console.error('Erro ao buscar tokens:', error);
        setStatus('❌ Erro ao buscar tokens do banco');
      } else {
        console.log('Tokens no banco:', data);
        setStatus(`📊 ${data?.length || 0} tokens no banco`);
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  // ✅ TESTE DE NOTIFICAÇÃO LOCAL
  const testarNotificacaoLocal = () => {
    if (!isClient || notificationPermission !== 'granted') {
      setStatus('❌ Permissão não concedida ou navegador não carregado');
      return;
    }
    
    new Notification('🔔 Teste Local', {
      body: 'Esta é uma notificação local do navegador!',
      icon: '/icon-192x192.png'
    });
    setStatus('✅ Notificação local enviada!');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>🔔 Teste de Notificações</h1>
      
      {status && (
        <div style={{ 
          backgroundColor: status.includes('❌') ? '#fee' : '#efe',
          padding: '15px', 
          borderRadius: '5px',
          margin: '10px 0',
          textAlign: 'center'
        }}>
          {status}
        </div>
      )}

      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <button onClick={handleTestNotification} style={buttonStyle}>
          🚀 1. Obter Token FCM
        </button>
        
        <button onClick={testarEdgeFunction} style={buttonStyle}>
          📨 2. Testar Notificação Push
        </button>
        
        <button onClick={testarNotificacaoLocal} style={buttonStyle} 
                disabled={!isClient || notificationPermission !== 'granted'}>
          🔔 3. Teste Local
        </button>
        
        <button onClick={verificarTokensBanco} style={buttonStyle}>
          📊 4. Verificar Banco
        </button>
      </div>

      {token && (
        <div style={{ 
          backgroundColor: '#e8f4fd', 
          padding: '15px', 
          borderRadius: '5px',
          margin: '15px 0'
        }}>
          <h3>Token FCM:</h3>
          <code style={{ 
            display: 'block', 
            background: '#fff', 
            padding: '10px', 
            borderRadius: '3px',
            fontSize: '12px',
            wordBreak: 'break-all'
          }}>
            {token}
          </code>
        </div>
      )}

      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '5px',
        margin: '15px 0'
      }}>
        <h3>📋 Status do Sistema:</h3>
        <p><strong>Usuário:</strong> {userProfile?.uid ? '✅ Logado' : '❌ Não logado'}</p>
        <p><strong>Permissão:</strong> {isClient ? notificationPermission : 'Carregando...'}</p>
        <p><strong>Service Worker:</strong> {isClient ? ('serviceWorker' in navigator ? '✅' : '❌') : 'Carregando...'}</p>
        <p><strong>Ambiente:</strong> {isClient ? '✅ Cliente (Browser)' : '⏳ Servidor'}</p>
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: '12px 24px',
  backgroundColor: '#3b7b2b',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  margin: '5px',
  fontSize: '16px'
};