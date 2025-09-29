import { supabase } from '/lib/supabase';

// 🎯 FUNÇÃO PRINCIPAL PARA ENVIAR NOTIFICAÇÕES
const sendNotification = async (userId, title, body, data = {}) => {
  try {
    // Buscar tokens FCM do usuário no banco de dados
    const { data: tokens, error: tokensError } = await supabase
      .from('user_tokens')
      .select('token')
      .eq('user_id', userId);

    if (tokensError) throw tokensError;
    if (!tokens || tokens.length === 0) {
      console.warn(`Nenhum token FCM encontrado para o usuário ${userId}`);
      return { success: false, error: 'Nenhum token FCM encontrado' };
    }

    const fcmTokens = tokens.map(t => t.token);

    // Montar payload para a Edge Function
    const payload = {
      title,
      body,
      fcmTokens,
      data: {
        ...data,
        timestamp: new Date().toISOString(),
        url: "/pedidos-pendentes" // URL padrão para redirecionamento
      }
    };

    // Chamar a Edge Function send-notification
    const { data: response, error } = await supabase.functions.invoke('send-notification', {
      body: payload
    });

    if (error) throw error;

    console.log('Notificação enviada com sucesso:', response);
    return { success: true, data: response };
  } catch (error) {
    console.error('Erro ao enviar notificação:', error.message);
    return { success: false, error: error.message };
  }
};

// 🎯 FUNÇÃO PARA NOTIFICAR UM NOVO PEDIDO
export const notifyNewOrder = async (userId, orderId, storeName) => {
  return await sendNotification(
    userId,
    '📦 Novo Pedido Disponível',
    `Um novo pedido da loja ${storeName} está aguardando entrega.`,
    { 
      type: 'new_order', 
      orderId: String(orderId),  // ✅ CONVERTER PARA STRING
      storeName: storeName 
    }
  );
};

// 🎯 FUNÇÃO PARA NOTIFICAR TODOS OS ENTREGADORES
const notifyAllCouriers = async (title, body, data = {}) => {
  try {
    // Buscar todos os tokens de entregadores ativos
    const { data: entregadores, error: entregadoresError } = await supabase
      .from('loja_associada')
      .select(`
        usuarios:uid_usuario (
          user_tokens (
            token
          )
        )
      `)
      .eq('funcao', 'entregador')
      .eq('status_vinculacao', 'ativo');

    if (entregadoresError) throw entregadoresError;
    const fcmTokens = entregadores.flatMap(entregador => 
      entregador.usuarios?.user_tokens?.map(t => t.token) || []
    ).filter(token => token); // Filtra tokens nulos ou inválidos

    if (fcmTokens.length === 0) {
      console.warn('Nenhum entregador encontrado com tokens FCM');
      return { success: false, error: 'Nenhum entregador encontrado' };
    }

    // Montar payload
    const payload = {
      title,
      body,
      fcmTokens,
      data: {
        ...data,
        timestamp: new Date().toISOString(),
        url: "/pedidos-pendentes"
      }
    };

    // Chamar a Edge Function
    const { data: response, error } = await supabase.functions.invoke('send-notification', {
      body: payload
    });

    if (error) throw error;

    console.log(`Notificação enviada para ${fcmTokens.length} entregadores:`, response);
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
      orderId: String(orderId),  // ✅ CONVERTER PARA STRING
      storeName: storeName 
    }
  );
};

// 🎯 FUNÇÃO PARA NOTIFICAR MUDANÇA DE STATUS
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
    { 
      type: 'status_change', 
      orderId: String(orderId),  // ✅ CONVERTER PARA STRING
      status, 
      customerName 
    }
  );
};