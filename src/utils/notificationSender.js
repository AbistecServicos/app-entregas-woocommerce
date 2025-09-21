import { supabase } from '/lib/supabase';

export const sendNotification = async (userId, title, body, data = {}) => {
  try {
    const { error } = await supabase.functions.invoke('send-notification', {
      body: { userId, title, body, data }
    });

    if (error) {
      console.error('Erro ao enviar notificação:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return false;
  }
};

// Funções específicas para seu sistema
export const notifyNewOrder = (userId, orderId, storeName) => {
  return sendNotification(
    userId,
    'Novo Pedido Disponível',
    `Um novo pedido da loja ${storeName} está aguardando entrega.`,
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
    'Status do Pedido Atualizado',
    statusMessages[status] || `Status do pedido alterado para ${status}`,
    { type: 'status_change', orderId, status, customerName }
  );
};