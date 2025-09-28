// pages/login.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/router';

// ==============================================================================
// COMPONENTE PRINCIPAL - PÁGINA DE LOGIN
// ==============================================================================
/**
 * Página de login com suporte a autenticação via Google OAuth e email/senha.
 * Inclui modal controlado, redirecionamento baseado em perfil (admin, gerente, entregador)
 * e links para cadastro e recuperação de senha.
 * Aprimoramentos: Validação de formulário, acessibilidade e feedback visual.
 */
export default function Login() {
  // ============================================================================
  // 1. ESTADOS DO COMPONENTE
  // ============================================================================
  const [email, setEmail] = useState('');              // Email do usuário
  const [password, setPassword] = useState('');        // Senha do usuário
  const [loading, setLoading] = useState(false);       // Estado de carregamento
  const [error, setError] = useState('');              // Mensagens de erro
  const [showPassword, setShowPassword] = useState(false); // Visibilidade da senha
  const [isModalOpen, setIsModalOpen] = useState(false);  // Controle do modal
  const [formValid, setFormValid] = useState(false);    // Validação do formulário
  const router = useRouter();

  // ============================================================================
  // 2. EFFECT: VALIDAR FORMULÁRIO EM TEMPO REAL
  // ============================================================================
  /**
   * Valida email e senha em tempo real, atualizando o estado de validade.
   * Requisitos: Email válido e senha com no mínimo 6 caracteres.
   */
  useEffect(() => {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const passwordValid = password.length >= 6;
    setFormValid(emailValid && passwordValid);
  }, [email, password]);

  // ============================================================================
  // 3. FUNÇÃO: TRADUZIR ERROS TÉCNICOS PARA MENSAGENS AMIGÁVEIS
  // ============================================================================
  /**
   * Converte erros técnicos do Supabase em mensagens amigáveis para o usuário
   */
  const translateError = (error) => {
    if (error.message.includes('Invalid login credentials')) {
      return 'E-mail ou senha incorretos. Verifique suas credenciais.';
    } else if (error.message.includes('Email not confirmed')) {
      return 'E-mail não confirmado. Verifique sua caixa de entrada.';
    } else if (error.message.includes('User not found')) {
      return 'Usuário não encontrado. Verifique o e-mail ou crie uma conta.';
    } else if (error.message.includes('Network error')) {
      return 'Erro de conexão. Verifique sua internet e tente novamente.';
    } else if (error.message.includes('Too many requests')) {
      return 'Muitas tentativas. Tente novamente em alguns minutos.';
    } else {
      return 'Erro ao fazer login. Tente novamente.';
    }
  };

// ============================================================================
// 4. FUNÇÃO: LOGIN COM EMAIL/SENHA (CORRIGIDA - SEM RELOAD)
// ============================================================================
const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  if (!formValid) {
    setError('Por favor, insira um email válido e uma senha com pelo menos 6 caracteres.');
    setLoading(false);
    return;
  }

  try {
    // 4.1. AUTENTICAÇÃO COM SUPABASE
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (authError) {
      throw authError;
    }

    console.log('✅ Usuário autenticado:', authData.user.email);

    // 4.2. VERIFICAÇÃO DE PERFIL E REDIRECIONAMENTO
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('is_admin')
      .eq('uid', authData.user.id)
      .single();
    
    if (userError) throw userError;

    let redirectPath = '/';

    if (usuario.is_admin) {
      redirectPath = '/admin';
    } else {
      const { data: associacoes, error: assocError } = await supabase
        .from('loja_associada')
        .select('funcao')
        .eq('uid_usuario', authData.user.id)
        .eq('status_vinculacao', 'ativo');
      
      if (assocError) throw new Error('Erro ao verificar permissões: ' + assocError.message);

      if (!associacoes || associacoes.length === 0) {
        setError('Você não possui acesso ativo. Contate o administrador.');
        await supabase.auth.signOut();
        return;
      }

      const primeiraAssociacao = associacoes[0];
      switch (primeiraAssociacao.funcao) {
        case 'gerente':
          redirectPath = '/todos-pedidos';
          break;
        case 'entregador':
          redirectPath = '/pedidos-pendentes';
          break;
        default:
          throw new Error('Função não reconhecida.');
      }
    }

    // ✅ CORREÇÃO: REDIRECIONAMENTO LIMPO
    console.log('🎯 Redirecionando para:', redirectPath);
    
    await router.push(redirectPath);
    console.log('🔄 Redirecionamento concluído com sucesso');
    
  } catch (error) {
    // 4.3. TRATAMENTO DE ERROS AMIGÁVEL
    setError(translateError(error));
    console.error('❌ Erro no login:', error);
  } finally {
    // 4.4. FINALIZAÇÃO
    setLoading(false);
  }
};

// ============================================================================
// 5. FUNÇÃO: LOGIN COM GOOGLE (CORRIGIDA)
// ============================================================================
const handleGoogleLogin = async () => {
  try {
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // ✅ CORREÇÃO: Redirecionar para página inicial, não para perfil
        redirectTo: `${window.location.origin}/`,
      },
    });
    
    if (error) throw error;
    
    console.log('🔐 Redirecionando para autenticação Google...');
    
  } catch (error) {
    setError(translateError(error));
    console.error('❌ Erro no login Google:', error);
  } finally {
    setLoading(false);
  }
};
  // ============================================================================
  // 6. RENDERIZAÇÃO DO COMPONENTE
  // ============================================================================
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800">
      <div className="max-w-md w-full mx-auto">
        
        {/* 6.1. SEÇÃO VISUAL: LOGO E TÍTULO */}
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center"
            role="img"
            aria-label="Ícone de entrega"
          >
            <span className="text-3xl text-purple-600">🚚</span>
          </div>
          <h1 className="text-3xl font-bold text-white">EntregasWoo</h1>
          <p className="text-purple-200 mt-2">Sistema de Gestão de Entregas</p>
        </div>

        {/* 6.2. CARD PRINCIPAL: CONTAINER DE LOGIN */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-6" id="login-title">
            Acessar Sistema
          </h2>

          {/* 6.2.1. EXIBIÇÃO DE ERRO */}
          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 flex items-start"
              role="alert"
            >
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* 6.2.2. BOTÃO DE LOGIN GOOGLE */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Login com Google"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Carregando...
              </span>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Entrar com Google
              </>
            )}
          </button>

          {/* 6.2.3. ABRE MODAL PARA LOGIN EMAIL/SENHA */}
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-purple-600 hover:text-purple-800 font-medium"
              aria-controls="email-login-modal"
            >
              Ou entre com email e senha
            </button>
          </div>

          {/* 6.2.4. MODAL DE LOGIN EMAIL/SENHA */}
          {isModalOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              role="dialog"
              aria-labelledby="email-login-modal-title"
              aria-modal="true"
              onClick={() => setIsModalOpen(false)}
            >
              <div 
                className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3
                    id="email-login-modal-title"
                    className="text-xl font-bold text-gray-800"
                  >
                    Login com Email
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="Fechar modal"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email-input"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email
                    </label>
                    <input
                      id="email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                      disabled={loading}
                      aria-required="true"
                      placeholder="seu@email.com"
                    />
                  </div>
                  
                  <div className="relative">
                    <label
                      htmlFor="password-input"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Senha
                    </label>
                    <input
                      id="password-input"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                      disabled={loading}
                      aria-required="true"
                      placeholder="Sua senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-9 text-gray-500"
                      disabled={loading}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading || !formValid}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Entrando...
                      </span>
                    ) : (
                      'Entrar'
                    )}
                  </button>
                </form>
                
                <div className="mt-4 text-center">
                  <Link
                    href="/recuperar-senha"
                    className="text-purple-600 hover:text-purple-800 text-sm"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Esqueceu sua senha?
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* 6.2.5. LINKS EXTRAS */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-gray-600 text-sm">
              Não tem uma conta?{' '}
              <Link
                href="/cadastro"
                className="text-purple-600 hover:text-purple-800 font-medium"
              >
                Criar nova conta
              </Link>
            </p>
          </div>
        </div>

        {/* 6.3. SEÇÃO DE RODAPÉ */}
        <div className="text-center mt-8">
          <p className="text-purple-200 text-sm">
            © 2025 EntregasWoo - Sistema de Gestão
          </p>
        </div>
      </div>
    </div>
  );
}