// components/Header.js

// ==================================================================
// BLOCO 1: IMPORTS E ESTADO
// ==================================================================
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; // Ajuste o caminho conforme sua estrutura

export default function Header({ 
  toggleSidebar, 
  showMenuButton = true, 
  title, 
  onNotificationClick 
}) {
  // ==================================================================
  // BLOCO 2: ESTADO DO COMPONENTE
  // ==================================================================
  const [notificationCount, setNotificationCount] = useState(0);
  const [lastPlayedSound, setLastPlayedSound] = useState(null);

  // ==================================================================
  // BLOCO 3: EFFECT PARA OUVIR NOVOS PEDIDOS EM TEMPO REAL
  // ==================================================================
  useEffect(() => {
    console.log('🎯 INICIANDO OUVINTE DE PEDIDOS...');
    
    // Canal para escutar inserts na tabela pedidos
    const channel = supabase
      .channel('novos-pedidos-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pedidos',
          filter: 'status_transporte=eq.aguardando'
        },
        (payload) => {
          console.log('🚨 NOVO PEDIDO DETECTADO:', payload.new);
          
          // ==========================================================
          // BLOCO 3.1: ATUALIZAR CONTADOR
          // ==========================================================
          setNotificationCount(prev => {
            const newCount = prev + 1;
            console.log(`🔔 Contador atualizado: ${prev} → ${newCount}`);
            return newCount;
          });

          // ==========================================================
          // BLOCO 3.2: TOCAR SOM DE NOTIFICAÇÃO
          // ==========================================================
          playNotificationSound();

          // ==========================================================
          // BLOCO 3.3: MOSTRAR NOTIFICAÇÃO NATIVA DO NAVEGADOR
          // ==========================================================
          showBrowserNotification(payload.new);
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da inscrição:', status);
      });

    // ==========================================================
    // BLOCO 4: LIMPEZA DO EFFECT
    // ==========================================================
    return () => {
      console.log('🧹 Limpando ouvinte de pedidos');
      supabase.removeChannel(channel);
    };
  }, []);

  // ==================================================================
  // BLOCO 5: FUNÇÃO PARA TOCAR SOM
  // ==================================================================
  const playNotificationSound = () => {
    // Prevenir spam de som (máximo 1 a cada 2 segundos)
    const now = Date.now();
    if (lastPlayedSound && (now - lastPlayedSound) < 2000) {
      console.log('⏸️ Som bloqueado (anti-spam)');
      return;
    }

    try {
      // Usar áudio nativo do navegador
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      setLastPlayedSound(now);
      console.log('🔊 Som de notificação tocado');
    } catch (error) {
      console.log('❌ Erro ao tocar som:', error);
      // Fallback: usar beep do sistema
      try {
        console.log('\x07'); // Beep no terminal (funciona em alguns navegadores)
      } catch (e) {
        console.log('⚠️ Som não suportado neste navegador');
      }
    }
  };

  // ==================================================================
  // BLOCO 6: FUNÇÃO PARA NOTIFICAÇÃO DO NAVEGADOR
  // ==================================================================
  const showBrowserNotification = (pedido) => {
    // Verificar se o navegador suporta notificações
    if (!("Notification" in window)) {
      console.log('❌ Este navegador não suporta notificações');
      return;
    }

    // Verificar se já temos permissão
    if (Notification.permission === "granted") {
      createNotification(pedido);
    } 
    // Se não tem permissão, pedir
    else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          createNotification(pedido);
        }
      });
    }
  };

  // ==================================================================
  // BLOCO 7: CRIAR NOTIFICAÇÃO
  // ==================================================================
  const createNotification = (pedido) => {
    const notification = new Notification("🚚 NOVO PEDIDO!", {
      body: `Pedido #${pedido.id_loja_woo || pedido.id} - ${pedido.nome_cliente || 'Cliente'}`,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "novo-pedido", // Agrupa notificações
      requireInteraction: true, // Fica até o usuário fechar
      actions: [
        {
          action: "open",
          title: "Ver Pedido"
        }
      ]
    });

    // Quando clicar na notificação, abrir a página de pedidos
    notification.onclick = () => {
      window.focus();
      window.location.href = '/pedidos-pendentes';
      notification.close();
    };

    // Fechar automaticamente após 10 segundos
    setTimeout(() => {
      notification.close();
    }, 10000);
  };

  // ==================================================================
  // BLOCO 8: FUNÇÃO PARA LIMPAR NOTIFICAÇÕES
  // ==================================================================
  const handleNotificationClick = () => {
    console.log('📌 Sino clicado - limpando notificações');
    
    // Zerar contador
    setNotificationCount(0);
    
    // Chamar callback do pai se existir
    if (onNotificationClick) {
      onNotificationClick();
    }
    
    // Opcional: navegar para página de notificações
    // window.location.href = '/pedidos-pendentes';
  };

  // ==================================================================
  // BLOCO 9: RENDER DO COMPONENTE (SEU CÓDIGO ORIGINAL - MANTIDO)
  // ==================================================================
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        
        {/* LADO ESQUERDO: BOTÃO HAMBURGUER */}
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

        {/* CENTRO: LOGO */}
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

        {/* LADO DIREITO: NOTIFICAÇÕES E PERFIL */}
        <div className="flex items-center space-x-3">
          
          {/* BOTÃO DE NOTIFICAÇÕES COM BADGE */}
          <button
            onClick={handleNotificationClick}
            className="relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label={`Notificações ${notificationCount > 0 ? `(${notificationCount} novas)` : ''}`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            
            {/* BADGE DE NOTIFICAÇÕES */}
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs min-w-[20px] h-5 flex items-center justify-center px-1 font-medium animate-pulse">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* BOTÃO DE PERFIL */}
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
            U
          </div>
        </div>
      </div>

      {/* INDICADOR DE STATUS (DESENVOLVIMENTO) */}
      {process.env.NODE_ENV === 'development' && notificationCount > 0 && (
        <div className="bg-blue-50 border-t border-blue-200 px-4 py-1">
          <p className="text-xs text-blue-700 text-center">
            🔔 {notificationCount} nova(s) notificação(ões) - Clique no sino para ver
          </p>
        </div>
      )}
    </header>
  );
}