// pages/pedidos-entregues.js
import PedidosEntregues from '../components/PedidosEntregues';

/**
 * Página principal de Pedidos Entregues
 * Delega a renderização para o componente PedidosEntregues
 * que decide qual versão mostrar (Admin, Gerente ou Entregador)
 */
export default function PedidosEntreguesPage() {
  return <PedidosEntregues />;
}