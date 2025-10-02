// ========================================
// NOTIFICATION-SENDER.JS - UTILITÁRIO CORRIGIDO
// ========================================
// Descrição: Envia push notifications via Supabase Edge Functions para FCM.
// Integração: Busca tokens em 'user_tokens'; payloads com data para SW (url, sound, count).
// Problema resolvido: Query complexa via joins simples; idempotência com localStorage; logs dev-only.
// Manutenção: Seções numeradas. Alinha com PDF (HS256 compatível via service_role).
// Dependências: supabase/functions.
// ========================================

import { supabase } from '/lib/supabase';

const isDev = process.env.NODE_ENV === 'development';

// ============================================================================
// 1. FUNÇÃO PRINCIPAL: ENVIAR NOTIFICAÇÃO (ORIGINAL + IDEMPOTÊNCIA)
// ============================================================================
// Busca tokens, monta payload, invoca Edge Function; cheque recente para evitar spam.
const sendNotification = async (userId, title, body, data = {}) => {
  try {
    // Idempotência: Cheque se enviado recente (5min window).
    const cacheKey = `notif_sent_${userId}_${data.orderId || 'general'}`;
    const lastSent = localStorage.getItem(cacheKey);
    if (lastSent && (Date.now() - parseInt(lastSent)) < 300000) { // 5min.
      if (isDev) console.log('🔄 Notificação já enviada recentemente (idempotência)');
      return { success: true, skipped: true };
    }

    // Buscar tokens FCM do usuário.
    const { data: tokens, error: tokensError } = await supabase
      .from('user_tokens')
      .select('token')
      .eq('user_id', userId);

    if (tokensError) throw tokensError;
    if (!tokens || tokens.length === 0) {
      if (isDev) console.warn(`Nenhum token FCM encontrado para o usuário ${userId}`);
      return { success: false, error: 'Nenhum token FCM encontrado' };
    }

    const fcmTokens = tokens.map(t => t.token).filter(Boolean); // Filtra nulos.

    // Payload: Com data para SW (url, sound, count do PDF compatível).
    const payload = {
      title,
      body,
      fcmTokens,
      data: {
        ...data,
        timestamp: new Date().toISOString(),
        url: data.url || "/pedidos-pendentes", // Redirecionamento SW.
        sound: data.sound || 'notification-sound.mp3', // Para postMessage.
        count: data.count || fcmTokens.length // Badge # (ex.: 3 pedidos).
      }
    };

    // Invocar Edge Function (retry 1x se falhar).
    let response;
    let error;
    for (let attempt = 1; attempt <= 2; attempt++) {
      ({ data: response, error } = await supabase.functions.invoke('send-notification', {
        body: payload
      }));

      if (!error) break;
      if (isDev) console.log(`Tentativa ${attempt} falhou:`, error.message);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Backoff.
    }

    if (error) throw error;

    localStorage.setItem(cacheKey, Date.now().toString()); // Marca enviado.
    if (isDev) console.log('Notificação enviada com sucesso:', response);
    return { success: true, data: response };
  } catch (error) {
    console.error('Erro ao enviar notificação:', error.message);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// 2. NOTIFICAR NOVO PEDIDO (ORIGINAL + STRING ID)
// ============================================================================
// Wrapper para new_order; integra com realtime trigger.
export const notifyNewOrder = async (userId, orderId, storeName) => {
  return await sendNotification(
    userId,
    '📦 Novo Pedido Disponível',
    `Um novo pedido da loja ${storeName} está aguardando entrega.`,
    { 
      type: 'new_order', 
      orderId: String(orderId), // ✅ String para JSON/SW.
      storeName,
      count: 1 // Badge inicial.
    }
  );
};

// ============================================================================
// 3. NOTIFICAR TODOS OS ENTREGADORES (QUERY CORRIGIDA)
// ============================================================================
// Busca via 2 queries simples (lojas → users → tokens); filtra ativos.
const notifyAllCouriers = async (title, body, data = {}) => {
  try {
    // 1. Buscar entregadores ativos (loja_associada).
    const { data: entregadores, error: entregadoresError } = await supabase
      .from('loja_associada')
      .select('uid_usuario')
      .eq('funcao', 'entregador')
      .eq('status_vinculacao', 'ativo');

    if (entregadoresError) throw entregadoresError;
    if (!entregadores || entregadores.length === 0) {
      if (isDev) console.warn('Nenhum entregador ativo encontrado');
      return { success: false, error: 'Nenhum entregador encontrado' };
    }

    const userIds = entregadores.map(e => e.uid_usuario).filter(Boolean);

    // 2. Buscar tokens por user IDs (batch para performance).
    const { data: userTokens, error: tokensError } = await supabase
      .from('user_tokens')
      .select('token, user_id')
      .in('user_id', userIds);

    if (tokensError) throw tokensError;

    const fcmTokens = userTokens
      .filter(ut => ut.token) // Tokens válidos.
      .map(ut => ut.token);

    if (fcmTokens.length === 0) {
      if (isDev) console.warn('Nenhum token FCM para entregadores');
      return { success: false, error: 'Nenhum token encontrado' };
    }

    // Payload para broadcast.
    const payload = {
      title,
      body,
      fcmTokens,
      data: {
        ...data,
        timestamp: new Date().toISOString(),
        url: "/pedidos-pendentes",
        count: fcmTokens.length // Badge total.
      }
    };

    // Invocar Edge Function (com retry como acima).
    let response;
    let error;
    for (let attempt = 1; attempt <= 2; attempt++) {
      ({ data: response, error } = await supabase.functions.invoke('send-notification', {
        body: payload
      }));

      if (!error) break;
      if (isDev) console.log(`Tentativa ${attempt} falhou para broadcast:`, error.message);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }

    if (error) throw error;

    if (isDev) console.log(`Notificação enviada para ${fcmTokens.length} entregadores:`, response);
    return { success: true, data: response };
  } catch (error) {
    console.error('Erro ao notificar entregadores:', error.message);
    return { success: false, error: error.message };
  }
};

export const notifyNewOrderToAllCouriers = async (orderId, storeName) => {
  return await notifyAllCouriers(
    '📦 Novo Pedido Disponível',
    `Um novo pedido da loja ${storeName} está aguardando entregador.`,
    { 
      type: 'new_order', 
      orderId: String(orderId), // ✅ String.
      storeName 
    }
  );
};

// ============================================================================
// 4. NOTIFICAR MUDANÇA DE STATUS (ORIGINAL + MESSAGES)
// ============================================================================
// Wrapper para status updates; mensagens dinâmicas.
export const notifyOrderStatusChange = async (userId, orderId, status, customerName) => { // Async para consistência.
  const statusMessages = {
    'aceito': `Pedido para ${customerName} foi aceito`,
    'em rota': `Pedido para ${customerName} saiu para entrega`,
    'entregue': `Pedido para ${customerName} foi entregue`,
    'cancelado': `Pedido para ${customerName} foi cancelado`
  };

  return sendNotification(
    userId,
    '🔄 Status do Pedido Atualizado',
    statusMessages[status] || `Status do pedido alterado para ${status}`,
    { 
      type: 'status_change', 
      orderId: String(orderId), // ✅ String.
      status, 
      customerName,
      count: 1
    }
  );
};