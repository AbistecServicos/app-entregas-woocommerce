 import { notifyNewOrder, notifyOrderStatusChange } from '../utils/notificationSender';

// Quando um novo pedido é criado
const handleNewOrder = (order) => {
  // Notificar entregadores da loja
  notifyNewOrder(entregadorId, order.id, order.loja_nome);
};

// Quando o status de um pedido muda
const updateOrderStatus = async (orderId, newStatus) => {
  // Sua lógica existente...
  
  // Notificar envolvidos
  if (newStatus === 'aceito') {
    // Notificar gerente que pedido foi aceito
    notifyOrderStatusChange(gerenteId, orderId, newStatus, order.nome_cliente);
  } else if (newStatus === 'entregue') {
    // Notificar gerente que pedido foi entregue
    notifyOrderStatusChange(gerenteId, orderId, newStatus, order.nome_cliente);
  }
};
