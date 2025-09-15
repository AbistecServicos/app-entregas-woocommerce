import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const router = useRouter();
  
  const menuItems = [
    { path: '/pedidos-pendentes', icon: '📋', label: 'Pedidos Pendentes' },
    { path: '/pedidos-aceitos', icon: '✅', label: 'Pedidos Aceitos' },
    { path: '/pedidos-entregues', icon: '🚚', label: 'Pedidos Entregues' },
    { path: '/admin', icon: '⚙️', label: 'Administração' },
  ];

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-purple-800 text-white
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:flex lg:flex-col
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-purple-700">
          <h1 className="text-2xl font-bold">EntregasWoo</h1>
          <p className="text-purple-300 text-sm">Sistema de Gestão</p>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 p-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center py-3 px-4 rounded-lg mb-2 transition-colors
                ${router.pathname === item.path
                  ? 'bg-purple-900 text-white'
                  : 'hover:bg-purple-700 text-purple-200'
                }`}
              onClick={() => window.innerWidth < 1024 && toggleSidebar()}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer do Sidebar com Logout */}
        <div className="p-4 border-t border-purple-700">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <span>👤</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">Usuário Admin</p>
              <p className="text-xs text-purple-300">online</p>
            </div>
          </div>

          {/* Botão de Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center py-2 px-4 bg-purple-700 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;