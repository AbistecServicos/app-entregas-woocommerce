// pages/relatorios.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';
import RouteGuard from '../components/RouteGuard';

export default function Relatorios() {
  const { userRole, userLojas, loading: userLoading } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const [dadosRelatorios, setDadosRelatorios] = useState(null);

  useEffect(() => {
    carregarRelatorios();
  }, []);

  const carregarRelatorios = async () => {
    try {
      setLoading(true);
      // Aqui você implementará a lógica para buscar dados de relatórios
      
      setDadosRelatorios({
        totalPedidos: 150,
        pedidosEntregues: 120,
        pedidosCancelados: 10,
        taxaSucesso: '92%'
      });
      
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <RouteGuard requiredRole="gerente">
      {/* ✅ REMOVIDO: <Layout> wrapper (já é aplicado pelo _app.js) */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Relatórios</h1>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">150</div>
              <div className="text-gray-600">Total de Pedidos</div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">120</div>
              <div className="text-gray-600">Pedidos Entregues</div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">10</div>
              <div className="text-gray-600">Pedidos Cancelados</div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">92%</div>
              <div className="text-gray-600">Taxa de Sucesso</div>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Relatórios Disponíveis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">📊 Relatório de Entregas</h3>
              <p className="text-gray-600 text-sm">Relatório detalhado de pedidos entregues por período</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">👥 Desempenho de Entregadores</h3>
              <p className="text-gray-600 text-sm">Estatísticas de performance por entregador</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">🏬 Relatório por Loja</h3>
              <p className="text-gray-600 text-sm">Dados de pedidos organizados por loja</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">📅 Relatório Mensal</h3>
              <p className="text-gray-600 text-sm">Consolidado mensal de todas as métricas</p>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}