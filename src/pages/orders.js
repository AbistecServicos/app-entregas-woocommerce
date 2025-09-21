import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase.from('pedidos').select('*');
        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <p>Carregando pedidos...</p>;
  if (error) return <p>Erro: {error}</p>;

  return (
    <div>
      <h1>Lista de Pedidos</h1>
      {orders.length === 0 ? (
        <p>Nenhum pedido encontrado.</p>
      ) : (
        <ul>
          {orders.map((order) => (
            <li key={order.id} style={{ marginBottom: '10px' }}>
              <strong>Pedido #{order.id_woo}</strong> - Cliente: {order.nome_cliente} - 
              Total: R${order.total} - Status: {order.status_transporte || 'Pendente'}
              <button
                onClick={() => handleAcceptOrder(order.id)}
                style={{ marginLeft: '10px', padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '3px' }}
                disabled={order.status_transporte === 'Entregue'}
              >
                Aceitar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  async function handleAcceptOrder(orderId) {
    const { error } = await supabase
      .from('pedidos')
      .update({ status_transporte: 'Aceito' })
      .eq('id', orderId);
    if (error) {
      setError(`Erro ao aceitar pedido: ${error.message}`);
    } else {
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status_transporte: 'Aceito' } : order
      ));
    }
  }
}