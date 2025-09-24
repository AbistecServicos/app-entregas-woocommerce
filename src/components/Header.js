// components/Header.js
export default function Header({ 
  toggleSidebar, 
  showMenuButton = true, 
  title, 
  notificationCount = 0, 
  onNotificationClick 
}) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        
        {/* ================================================================== */}
        {/* LADO ESQUERDO: BOTÃO HAMBURGUER (CONDICIONAL) */}
        {/* ================================================================== */}
        <div className="flex items-center">
          {showMenuButton && (
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              aria-label="Abrir menu"
            >
              {/* Ícone do hamburger */}
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          
          {/* Espaço para alinhamento quando não há botão */}
          {!showMenuButton && <div className="w-10 h-10"></div>}
        </div>

        {/* ================================================================== */}
        {/* CENTRO: TÍTULO (CUSTOMIZÁVEL PARA PÁGINAS SEM SIDEBAR) */}
        {/* ================================================================== */}
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-xl font-semibold text-gray-900">
            {title || 'EntregasWoo'} {/* Usa título customizado ou padrão */}
          </h1>
        </div>

        {/* ================================================================== */}
        {/* LADO DIREITO: NOTIFICAÇÕES E PERFIL */}
        {/* ================================================================== */}
        <div className="flex items-center space-x-3">
          
          {/* ================================================================ */}
          {/* BOTÃO DE NOTIFICAÇÕES COM BADGE */}
          {/* ================================================================ */}
          <button
            onClick={onNotificationClick}
            className="relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label={`Notificações ${notificationCount > 0 ? `(${notificationCount} novas)` : ''}`}
          >
            {/* Ícone de sino (bell) */}
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            
            {/* BADGE DE NOTIFICAÇÕES (aparece apenas se houver notificações) */}
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs min-w-[20px] h-5 flex items-center justify-center px-1 font-medium animate-pulse">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* ================================================================ */}
          {/* BOTÃO DE PERFIL (FUTURO) - MANTIDO COMO ESPAÇO RESERVADO */}
          {/* ================================================================ */}
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
            U
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* INDICADOR DE STATUS (APENAS DESENVOLVIMENTO) */}
      {/* ================================================================== */}
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