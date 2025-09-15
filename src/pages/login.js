import { useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/router';

// ==============================================================================
// COMPONENTE PRINCIPAL - PÁGINA DE LOGIN
// ==============================================================================
export default function Login() {
  // ============================================================================
  // 1. ESTADOS DO COMPONENTE
  // ============================================================================
  const [email, setEmail] = useState('');              // Email do usuário
  const [password, setPassword] = useState('');        // Senha do usuário
  const [loading, setLoading] = useState(false);       // Estado de carregamento
  const [error, setError] = useState('');              // Mensagens de erro
  const [showPassword, setShowPassword] = useState(false); // Controla visibilidade da senha
  const router = useRouter();                          // Router para navegação

  // ============================================================================
  // 2. FUNÇÃO PRINCIPAL: LOGIN COM EMAIL/SENHA
  // ============================================================================
  const handleLogin = async (e) => {
    e.preventDefault(); // Previne comportamento padrão do formulário
    setLoading(true);   // Inicia estado de carregamento
    setError('');       // Limpa erros anteriores

    try {
      // ========================================================================
      // 2.1. AUTENTICAÇÃO NO SUPABASE
      // ========================================================================
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError; // Se houver erro na autenticação

      // ========================================================================
      // 2.2. VERIFICAÇÃO SE É ADMINISTRADOR
      // ========================================================================
      /**
       * Administradores têm acesso total e não precisam de vinculação com lojas
       * Verificamos pela flag is_admin na tabela usuarios
       */
      const { data: usuario, error: userError } = await supabase
        .from('usuarios')
        .select('is_admin')
        .eq('uid', authData.user.id)
        .single();

      if (userError) throw userError;

      // Se for admin, redireciona diretamente para painel admin
      if (usuario.is_admin) {
        router.push('/admin');
        return; // Interrompe a execução aqui
      }

      // ========================================================================
      // 2.3. VERIFICAÇÃO DE VINCULO COM LOJAS (NÃO-ADMIN)
      // ========================================================================
      /**
       * Para usuários não-admin, verificamos se estão vinculados a alguma loja ativa
       * UM GERENTE só pode ter UMA loja
       * UM ENTREGADOR pode ter MÚLTIPLAS lojas
       */
      const { data: associacoes, error: assocError } = await supabase
        .from('loja_associada')
        .select('funcao, id_loja, loja_nome')
        .eq('uid_usuario', authData.user.id)
        .eq('status_vinculacao', 'ativo');
        // ⚠️ REMOVIDO .single() para permitir múltiplas lojas

      // Verifica erros na consulta
      if (assocError) {
        throw new Error('Erro ao verificar permissões: ' + assocError.message);
      }

      // Verifica se usuário tem pelo menos uma loja ativa
      if (!associacoes || associacoes.length === 0) {
        throw new Error('Usuário não possui acesso ativo ao sistema. Entre em contato com o administrador.');
      }

      // ========================================================================
      // 2.4. VALIDAÇÃO ESPECÍFICA PARA GERENTES
      // ========================================================================
      /**
       * Gerentes não podem estar vinculados a múltiplas lojas
       * Se encontrar um gerente com mais de uma loja, é um erro de configuração
       */
      const gerentes = associacoes.filter(assoc => assoc.funcao === 'gerente');
      if (gerentes.length > 0 && associacoes.length > 1) {
        throw new Error('Gerente não pode estar associado a múltiplas lojas. Contate o administrador.');
      }

      // ========================================================================
      // 2.5. REDIRECIONAMENTO BASEADO NA FUNÇÃO
      // ========================================================================
      /**
       * Usa a PRIMEIRA associação para determinar o redirecionamento
       * Para entregadores com múltiplas lojas, todas serão consideradas depois
       */
      const primeiraAssociacao = associacoes[0];
      
      switch (primeiraAssociacao.funcao) {
        case 'gerente':
          router.push('/todos-pedidos'); // Gerente vai para gestão completa
          break;
        case 'entregador':
          router.push('/pedidos-pendentes'); // Entregador vai para pedidos disponíveis
          break;
        default:
          throw new Error('Função não reconhecida: ' + primeiraAssociacao.funcao);
      }

    } catch (error) {
      // ========================================================================
      // 2.6. TRATAMENTO DE ERROS
      // ========================================================================
      setError(error.message);
      console.error('Erro no login:', error);
    } finally {
      // ========================================================================
      // 2.7. FINALIZAÇÃO (EXECUTA SEMPRE, COM SUCESSO OU ERRO)
      // ========================================================================
      setLoading(false); // Finaliza estado de carregamento
    }
  };

  // ============================================================================
  // 3. FUNÇÃO: LOGIN COM GOOGLE (OAUTH)
  // ============================================================================
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (error) {
      setError(error.message);
    }
  };

  // ============================================================================
  // 4. RENDERIZAÇÃO DO COMPONENTE
  // ============================================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto">
        
        {/* ==================================================================== */}
        {/* LOGO E IDENTIDADE VISUAL */}
        {/* ==================================================================== */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl text-purple-600">🚚</span>
          </div>
          <h2 className="text-3xl font-bold text-white">EntregasWoo</h2>
          <p className="text-purple-200 mt-2">Sistema de Gestão de Entregas</p>
        </div>

        {/* ==================================================================== */}
        {/* CARD PRINCIPAL DE LOGIN */}
        {/* ==================================================================== */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">
            Acessar Sistema
          </h3>

          {/* MENSAGENS DE ERRO */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* ================================================================ */}
          {/* FORMULÁRIO DE LOGIN */}
          {/* ================================================================ */}
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* CAMPO EMAIL */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                placeholder="seu@email.com"
                disabled={loading}
              />
            </div>

            {/* CAMPO SENHA COM BOTÃO DE VISUALIZAÇÃO */}
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                  placeholder="Sua senha"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center mt-1"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {/* Ícone dinâmico (mostrar/ocultar senha) */}
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* BOTÃO DE SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* ================================================================ */}
          {/* LOGIN ALTERNATIVO (GOOGLE) */}
          {/* ================================================================ */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ou</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full mt-4 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Entrar com Google
            </button>
          </div>

          {/* ================================================================ */}
          {/* LINKS EXTRAS */}
          {/* ================================================================ */}
          <div className="mt-6 text-center space-y-3">
            <Link 
              href="/cadastro" 
              className="text-purple-600 hover:text-purple-800 text-sm font-medium"
            >
              Criar nova conta
            </Link>
            <br />
            <Link 
              href="/recuperar-senha" 
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Esqueceu sua senha?
            </Link>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* FOOTER */}
        {/* ==================================================================== */}
        <div className="text-center mt-8">
          <p className="text-purple-200 text-sm">
            © 2024 EntregasWoo - Sistema de Gestão
          </p>
        </div>
      </div>
    </div>
  );
}