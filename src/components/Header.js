// components/Header.js
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

// ==============================================================================
// COMPONENTE HEADER COM NOTIFICAÇÕES EM TEMPO REAL
// ==============================================================================
const Header = ({ 
  toggleSidebar, 
  showMenuButton = true,
  title,
  notificationCount = 0,
  onNotificationClick,
  userLojas = [] // ✅ RECEBE LOJAS DO LAYOUT
}) => {
  // ============================================================================
  // 1. ESTADOS DO COMPONENTE
  // ============================================================================
  const [realTimeNotifications, setRealTimeNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef(null);

  // ============================================================================
  // 2. EFFECT: OUVIR PEDIDOS DAS LOJAS DO USUÁRIO (CORRIGIDO)
  // ============================================================================
  useEffect(() => {
    console.log('🎯 INICIANDO OUVINTE DE PEDIDOS...');
    console.log('🏪 Lojas do usuário:', userLojas);

    // ✅ BLOCO 2.1: VALIDAÇÃO - NÃO ESCUTAR SEM LOJAS
    if (!userLojas || userLojas.length === 0) {
      console.log('⏭️ Header - Sem lojas para escutar, saindo...');
      return;
    }

    // ✅ BLOCO 2.2: EXTRAIR IDs DAS LOJAS
    const lojaIds = userLojas.map(loja => loja.id_loja || loja);
    console.log('🔍 IDs das lojas para filtrar:', lojaIds);

    // ✅ BLOCO 2.3: CRIAR CANAL SUPABASE
    const channel = supabase.channel('pedidos-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pedidos',
        },
        (payload) => {
          console.log('📦 Novo pedido detectado:', payload);
          
          // ✅ BLOCO 2.4: FILTRAR POR LOJAS DO USUÁRIO
          const pertenceAoUsuario = lojaIds.includes(payload.new.id_loja);
          
          console.log('🔍 Pedido pertence ao usuário?', pertenceAoUsuario);
          console.log('📋 Lojas do usuário:', lojaIds);
          console.log('🆔 Loja do pedido:', payload.new.id_loja);

          if (pertenceAoUsuario) {
            console.log('🎯 Pedido FILTRADO - Mostrar notificação');
            
            // ✅ BLOCO 2.5: CRIAR NOTIFICAÇÃO
            createBrowserNotification(payload.new);
            
            // ✅ BLOCO 2.6: ATUALIZAR ESTADO
            setRealTimeNotifications(prev => [payload.new, ...prev].slice(0, 20));
            setUnreadCount(prev => prev + 1);
          } else {
            console.log('🚫 Pedido IGNORADO - Não pertence às lojas do usuário');
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da inscrição:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Ouvinte ativo - aguardando novos pedidos...');
        }
      });

    channelRef.current = channel;

    // ✅ BLOCO 2.7: CLEANUP
    return () => {
      console.log('🧹 Header - Limpando listener de pedidos');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [userLojas]); // ✅ DEPENDE APENAS DE userLojas

  // ============================================================================
  // 3. FUNÇÃO: CRIAR NOTIFICAÇÃO DO NAVEGADOR
  // ============================================================================
  const createBrowserNotification = (pedido) => {
    try {
      console.log('📢 Criando notificação do navegador...');
      
      // ✅ BLOCO 3.1: VERIFICAR PERMISSÃO
      if (!('Notification' in window)) {
        console.log('❌ Navegador não suporta notificações');
        return;
      }

      if (Notification.permission !== 'granted') {
        console.log('❌ Permissão de notificação não concedida');
        return;
      }

      // ✅ BLOCO 3.2: CRIAR NOTIFICAÇÃO
      const notification = new Notification('🚚 Novo Pedido!', {
        body: `Pedido #${pedido.id} - ${pedido.endereco_entrega?.substring(0, 30)}...`,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'novo-pedido',
        requireInteraction: true,
      });

      console.log('✅ Notificação criada com sucesso');

      // ✅ BLOCO 3.3: CLICK NA NOTIFICAÇÃO
      notification.onclick = () => {
        console.log('👆 Notificação clicada - redirecionando...');
        window.focus();
        window.location.href = '/pedidos-pendentes';
        notification.close();
      };

      // ✅ BLOCO 3.4: FECHAR AUTOMATICAMENTE
      setTimeout(() => {
        notification.close();
        console.log('⏰ Notificação fechada automaticamente');
      }, 10000);

    } catch (error) {
      console.log('❌ Erro ao criar notificação:', error);
    }
  };

  // ============================================================================
  // 4. FUNÇÃO: LIMPAR NOTIFICAÇÕES
  // ============================================================================
  const handleNotificationClick = () => {
    console.log('📌 Sino clicado - limpando notificações');
    console.log('🔢 Contador antes:', unreadCount);
    
    // ✅ BLOCO 4.1: ZERAR CONTADOR
    setUnreadCount(0);
    
    // ✅ BLOCO 4.2: CHAMAR CALLBACK DO PAI
    if (onNotificationClick) {
      onNotificationClick();
    }
    
    console.log('✅ Notificações limpas');
  };

  // ============================================================================
  // 5. CALCULAR TOTAL DE NOTIFICAÇÕES
  // ============================================================================
  const totalNotifications = notificationCount + unreadCount;

  // ============================================================================
  // 6. FORMATAR LOJAS PARA EXIBIÇÃO (CORREÇÃO DO [object Object])
  // ============================================================================
  const formatUserLojas = () => {
    if (!userLojas || userLojas.length === 0) {
      return 'Nenhuma';
    }
    
    // ✅ CORREÇÃO: Extrair apenas os IDs das lojas
    const lojaIds = userLojas.map(loja => loja.id_loja || loja);
    return lojaIds.join(', ');
  };

  // ============================================================================
  // 7. RENDER DO COMPONENTE
  // ============================================================================
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        
        {/* ✅ BLOCO 7.1: LADO ESQUERDO - BOTÃO HAMBURGUER */}
        <div className="flex items-center">
          {showMenuButton && (
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              aria-label="Abrir menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          {!showMenuButton && <div className="w-10 h-10"></div>}
        </div>

        {/* ✅ BLOCO 7.2: CENTRO - LOGO */}
        <div className="flex-1 flex justify-center lg:justify-start">
          <div className="flex items-center">
            <img 
              src="https://czzidhzzpqegfvvmdgno.supabase.co/storage/v1/object/public/box/logos/logo_entregaswoo_600x240.png"
              alt="EntregasWoo"
              className="h-16 w-auto object-contain"
            />
            {title && (
              <h1 className="text-xl font-semibold text-gray-900 ml-4 hidden md:block">
                {title}
              </h1>
            )}
          </div>
        </div>

        {/* ✅ BLOCO 7.3: LADO DIREITO - NOTIFICAÇÕES E PERFIL */}
        <div className="flex items-center space-x-3">
          
          {/* BOTÃO DE NOTIFICAÇÕES COM BADGE */}
          <button
            onClick={handleNotificationClick}
            className="relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label={`Notificações ${totalNotifications > 0 ? `(${totalNotifications} novas)` : ''}`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            
            {/* BADGE DE NOTIFICAÇÕES */}
            {totalNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs min-w-[20px] h-5 flex items-center justify-center px-1 font-medium animate-pulse">
                {totalNotifications > 9 ? '9+' : totalNotifications}
              </span>
            )}
          </button>

          {/* BOTÃO DE PERFIL */}
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
            U
          </div>
        </div>
      </div>

      {/* ✅ BLOCO 7.4: INDICADOR DE STATUS (DESENVOLVIMENTO) */}
      {process.env.NODE_ENV === 'development' && totalNotifications > 0 && (
        <div className="bg-blue-50 border-t border-blue-200 px-4 py-1">
          <p className="text-xs text-blue-700 text-center">
            🔔 {totalNotifications} nova(s) notificação(ões) - Clique no sino para ver
          </p>
        </div>
      )}

      {/* ✅ BLOCO 7.5: DEBUG - MOSTRAR LOJAS DO USUÁRIO (CORRIGIDO) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border-t border-yellow-200 px-4 py-1">
          <p className="text-xs text-yellow-700 text-center">
            🏪 Lojas do usuário: {formatUserLojas()}
          </p>
        </div>
      )}
    </header>
  );
};

export default Header;