// hooks/useRealtimePedidos.js
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useRealtimePedidos = (callback) => {
  useEffect(() => {
    const subscription = supabase
      .channel('pedidos-realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'pedidos' 
        }, 
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [callback]);
};

// Como usar em uma página:
const [pedidos, setPedidos] = useState([]);

useRealtimePedidos((payload) => {
  // Atualizar a lista de pedidos em tempo real
  if (payload.eventType === 'INSERT') {
    setPedidos(prev => [payload.new, ...prev]);
  } else if (payload.eventType === 'UPDATE') {
    setPedidos(prev => prev.map(p => 
      p.id === payload.new.id ? payload.new : p
    ));
  } else if (payload.eventType === 'DELETE') {
    setPedidos(prev => prev.filter(p => p.id !== payload.old.id));
  }
});