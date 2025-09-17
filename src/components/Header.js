// components/Header.js
export default function Header({ toggleSidebar, showMenuButton = true, title }) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        
        {/* ================================================================== */}
        {/* BOTÃO HAMBURGUER (CONDICIONAL) */}
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
        {/* TÍTULO (CUSTOMIZÁVEL PARA PÁGINAS SEM SIDEBAR) */}
        {/* ================================================================== */}
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-xl font-semibold text-gray-900">
            {title || 'EntregasWoo'} {/* Usa título customizado ou padrão */}
          </h1>
        </div>

        {/* ================================================================== */}
        {/* ESPAÇO PARA ELEMENTOS À DIREITA (BOTÃO DE PERFIL, ETC) */}
        {/* ================================================================== */}
        <div className="w-10 h-10"></div>
      </div>
    </header>
  );
}