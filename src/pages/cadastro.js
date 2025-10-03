// pages/cadastro.js
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/router';

// ==============================================================================
// COMPONENTE PRINCIPAL - PÁGINA DE CADASTRO COM NOME E TELEFONE
// ==============================================================================
/**
 * Inclui campos para nome completo e telefone, essenciais para credenciamento de motoristas.
 * Exibe mensagem sobre confirmação de email após cadastro.
 * Redireciona para /login após sucesso para tentativa de login.
 * Aprendizado: Integre mensagens de suporte ao fluxo de autenticação do Supabase.
 */
export default function Cadastro() {
  // ============================================================================
  // 1. ESTADOS DO COMPONENTE (BLOCO DE ESTADOS)
  // ============================================================================
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nome_completo: '',
    telefone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  // ============================================================================
  // 2. FUNÇÃO: ATUALIZAÇÃO DOS CAMPOS (BLOCO DE FUNÇÃO)
  // ============================================================================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

// ============================================================================
// 3. FUNÇÃO: SUBMISSÃO DO CADASTRO (CORREÇÃO CHROME)
// ============================================================================
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  setSuccess('');

  // 3.1. VALIDAÇÕES (mantido igual)
  if (formData.password !== formData.confirmPassword) {
    setError('As senhas não coincidem');
    setLoading(false);
    return;
  }
  if (formData.password.length < 6) {
    setError('A senha deve ter pelo menos 6 caracteres');
    setLoading(false);
    return;
  }
  if (!formData.nome_completo.trim()) {
    setError('O nome completo é obrigatório');
    setLoading(false);
    return;
  }
  if (!formData.telefone.trim()) {
    setError('O telefone é obrigatório');
    setLoading(false);
    return;
  }

  try {
    // 3.2. CRIAÇÃO NO AUTH
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          nome_completo: formData.nome_completo,
          telefone: formData.telefone
        },
        // ✅ CORREÇÃO: Email redirect para Chrome
        emailRedirectTo: `${window.location.origin}/login`
      }
    });

    if (authError) throw authError;

    // ✅ CORREÇÃO: Pequeno delay para Chrome
    await new Promise(resolve => setTimeout(resolve, 300));

    // 3.3. INSERÇÃO NA TABELA USUÁRIOS
    const { error: userError } = await supabase
      .from('usuarios')
      .insert({
        uid: authData.user.id,
        email: formData.email,
        nome_usuario: formData.email,
        nome_completo: formData.nome_completo,
        telefone: formData.telefone,
        foto: '',
        is_admin: false
      });

    if (userError) throw userError;

    // 3.4. SUCESSO E REDIRECIONAMENTO
    setSuccess('Cadastro realizado! Verifique seu email e clique no link de confirmação para fazer login.');
    
    // ✅ CORREÇÃO: Redirecionamento mais robusto para Chrome
    setTimeout(() => {
      router.push('/login').then(() => {
        // Forçar reload se necessário
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      });
    }, 2000);
    
  } catch (error) {
    console.error('Erro detalhado:', error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
};

  // ============================================================================
  // 4. RENDERIZAÇÃO DO COMPONENTE (BLOCO DE JSX)
  // ============================================================================
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800">
      <div className="max-w-md w-full mx-auto">
        
        {/* 4.1. SEÇÃO VISUAL: LOGO E TÍTULO */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl text-purple-600">🚚</span>
          </div>
          <h2 className="text-3xl font-bold text-white">EntregasWoo</h2>
          <p className="text-purple-200 mt-2">Criar Nova Conta</p>
        </div>

        {/* 4.2. CARD PRINCIPAL: CONTAINER DE CADASTRO */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">
            Cadastro
          </h3>

          {/* 4.2.1. EXIBIÇÃO DE ERRO OU SUCESSO */}
          {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4">{success}</div>}

          {/* 4.2.2. FORMULÁRIO COM NOME E TELEFONE */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nome_completo" className="block text-sm font-medium text-gray-700">
                Nome Completo
              </label>
              <input
                id="nome_completo"
                name="nome_completo"
                type="text"
                value={formData.nome_completo}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                placeholder="Seu nome completo"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">
                Telefone
              </label>
              <input
                id="telefone"
                name="telefone"
                type="tel"
                value={formData.telefone}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                placeholder="(11) 99999-9999"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                placeholder="seu@email.com"
                disabled={loading}
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                  placeholder="Mínimo 6 caracteres"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center mt-1"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="relative">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Senha
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                  placeholder="Digite novamente sua senha"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center mt-1"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition disabled:opacity-50"
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>

          {/* 4.2.3. LINK PARA LOGIN */}
          <div className="mt-6 text-center">
            <Link href="/login" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
              Já tem uma conta? Faça login
            </Link>
          </div>
        </div>

        {/* 4.3. SEÇÃO DE RODAPÉ */}
        <div className="text-center mt-8">
          <p className="text-purple-200 text-sm">
            © 2025 EntregasWoo - Sistema de Gestão
          </p>
        </div>
      </div>
    </div>
  );
}

// Não usar layout para esta página
Cadastro.noLayout = true;