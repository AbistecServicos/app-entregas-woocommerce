// utils/filterPedidos.js
export const filterPedidosPorUsuario = (pedidos, userRole, userLojas) => {
  if (userRole === 'admin') {
    // Admin vê TUDO
    return pedidos;
  }

  if (userRole === 'gerente' && userLojas.length === 1) {
    // Gerente vê apenas sua loja
    return pedidos.filter(pedido => pedido.id_loja === userLojas[0].id_loja);
  }

  if (userRole === 'entregador' && userLojas.length > 0) {
    // Entregador vê pedidos de todas as suas lojas
    const lojasIds = userLojas.map(loja => loja.id_loja);
    return pedidos.filter(pedido => lojasIds.includes(pedido.id_loja));
  }

  // Visitante ou erro não vê nada
  return [];
};