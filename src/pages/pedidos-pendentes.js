import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

// ✅ Exportação padrão do componente
export default function PedidosPendentes() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndGetPedidos();
  }, []);

  const checkAuthAndGetPedidos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      await getPedidosPendentes(user.id);
    } catch (error) {
      console.error('Erro de autenticação:', error);
      router.push('/login');
    }
  };

  const getPedidosPendentes = async (userId) => {
    try {
      // ... sua lógica para buscar pedidos
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      setLoading(false);
    }
  };

  // ✅ Retorne JSX válido
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-purple-800 mb-6">📋 Pedidos Pendentes</h1>
      
      {loading ? (
        <p>Carregando pedidos...</p>
      ) : (
        <div>
          {/* Sua lista de pedidos aqui */}
        </div>
      )}
    </div>
  );
}

// ❌ Evite exportações nomeadas para o componente principal