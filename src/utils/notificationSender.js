import { supabase } from '/lib/supabase';

// 🎯 FUNÇÃO PRINCIPAL ATUALIZADA
export const sendNotification = async (userId, title, body, data = {}) => {
  try {
    // 1. Buscar tokens FCM do usuário
    const { data: tokens, error: tokensError } = await supabase
      .from('user_tokens')
      .select('token')
      .eq('user_id', userId);

    if (tokensError || !tokens || tokens.length === 0) {
      console.error('❌ Usuário não tem tokens FCM registrados:', userId);
      return false;
    }

    const fcmTokens = tokens.map(t => t.token);

    // 2. Chamar a Edge Function com a estrutura CORRETA
    const { error } = await supabase.functions.invoke('send-notification', {
      body: { 
        title, 
        body, 
        fcmTokens,  // 🎯 AGORA ENVIA TOKENS, NÃO USER ID
        data 
      }
    });

    if (error) {
      console.error('❌ Erro ao enviar notificação:', error);
      return false;
    }

    console.log('✅ Notificação enviada para', fcmTokens.length, 'dispositivo(s)');
    return true;
  } catch (error) {
    console.error('💥 Erro ao enviar notificação:', error);
    return false;
  }
};

// 🎯 FUNÇÃO PARA NOTIFICAR TODOS OS ENTREGADORES
export const notifyAllCouriers = async (title, body, data = {}) => {
  try {
    // Buscar TODOS os entregadores ativos
    const { data: entregadores, error } = await supabase
      .from('users')
      .select('uid')
      .eq('tipo', 'entregador')
      .eq('ativo', true);

    if (error || !entregadores || entregadores.length === 0) {
      console.error('❌ Nenhum entregador encontrado');
      return false;
    }

    // Enviar notificação para cada entregador
    const results = await Promise.all(
      entregadores.map(entregador => 
        sendNotification(entregador.uid, title, body, data)
      )
    );

    const successCount = results.filter(result => result).length;
    console.log(`✅ Notificações enviadas: ${successCount}/${entregadores.length}`);
    
    return successCount > 0;
  } catch (error) {
    console.error('💥 Erro ao notificar entregadores:', error);
    return false;
  }
};

// 🎯 FUNÇÕES ESPECÍFICAS
export const notifyNewOrder = async (userId, orderId, storeName) => {
  return await sendNotification(
    userId,
    '📦 Novo Pedido Disponível',
    `Um novo pedido da loja ${storeName} está aguardando entrega.`,
    { type: 'new_order', orderId, storeName }
  );
};

export const notifyNewOrderToAllCouriers = async (orderId, storeName) => {
  return await notifyAllCouriers(
    '📦 Novo Pedido Disponível',
    `Um novo pedido da loja ${storeName} está aguardando entregador.`,
    { type: 'new_order', orderId, storeName }
  );
};

export const notifyOrderStatusChange = (userId, orderId, status, customerName) => {
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
    { type: 'status_change', orderId, status, customerName }
  );
};