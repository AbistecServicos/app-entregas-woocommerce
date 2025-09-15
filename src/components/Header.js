const Header = ({ toggleSidebar }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between p-4">
        {/* Botão Hamburger para mobile */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-md text-gray-600 hover:text-purple-800 hover:bg-gray-100"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Título da página atual */}
        <h2 className="text-xl font-semibold text-gray-800">
          Dashboard
        </h2>

        {/* User menu */}
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-600 hover:text-purple-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
            A
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;