// components/UserProfile.js
import { useState } from 'react';

// ==============================================================================
// COMPONENTE USERPROFILE PARA SIDEBAR (CORRIGIDO)
// ==============================================================================
const UserProfile = ({ 
  user = null, 
  loading = false,
  showLogout = false,
  onLogout,
  onLogin 
}) => {
  // ============================================================================
  // 1. ESTADO PARA MENU DE USUÁRIO
  // ============================================================================
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // ============================================================================
  // 2. SE ESTÁ CARREGANDO
  // ============================================================================
  if (loading) {
    return (
      <div className="flex items-center space-x-3 p-3 bg-purple-700 rounded-lg">
        <div className="w-10 h-10 bg-purple-600 rounded-full animate-pulse"></div>
        <div className="flex-1">
          <div className="h-4 bg-purple-600 rounded animate-pulse mb-2"></div>
          <div className="h-3 bg-purple-600 rounded animate-pulse w-3/4"></div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 3. SE USUÁRIO ESTÁ LOGADO - MOSTRAR DADOS E BOTÃO SAIR
  // ============================================================================
  if (user && showLogout) {
    return (
      <div className="bg-purple-700 rounded-lg p-4">
        {/* ✅ BLOCO 3.1: AVATAR E INFORMAÇÕES */}
        <div className="flex items-center space-x-3 mb-3">
          {user.foto ? (
            <img 
              src={user.foto} 
              alt="Foto do perfil"
              className="w-10 h-10 rounded-full border-2 border-purple-400"
            />
          ) : (
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user.nome_completo?.[0]?.toUpperCase() || user.nome_usuario?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">
              {user.nome_completo || user.nome_usuario || 'Usuário'}
            </p>
            <p className="text-purple-200 text-sm truncate">
              {user.email || 'Sem email'}
            </p>
          </div>
        </div>

        {/* ✅ BLOCO 3.2: BOTÃO DE LOGOUT */}
        <button
          onClick={onLogout}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sair
        </button>
      </div>
    );
  }

  // ============================================================================
  // 4. SE USUÁRIO NÃO ESTÁ LOGADO - MOSTRAR BOTÃO LOGIN
  // ============================================================================
  return (
    <div className="bg-purple-700 rounded-lg p-4 text-center">
      {/* ✅ BLOCO 4.1: ÍCONE DE VISITANTE */}
      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
        <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      
      {/* ✅ BLOCO 4.2: TEXTO DE VISITANTE */}
      <h3 className="text-white font-medium mb-1">Visitante</h3>
      <p className="text-purple-200 text-sm mb-3">Faça login para acessar</p>
      
      {/* ✅ BLOCO 4.3: BOTÃO DE LOGIN */}
      <button
        onClick={onLogin}
        className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        Fazer Login
      </button>
    </div>
  );
};

export default UserProfile;