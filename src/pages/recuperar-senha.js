import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/atualizar-senha`,
      });

      if (error) throw error;

      setSuccess('Email de recuperação enviado! Verifique sua caixa de entrada.');

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl text-purple-600">🔒</span>
          </div>
          <h2 className="text-3xl font-bold text-white">EntregasWoo</h2>
          <p className="text-purple-200 mt-2">Recuperar Senha</p>
        </div>

        {/* Card de Recuperação */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">
            Recuperar Senha
          </h3>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Email de Recuperação'}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-3">
            <Link href="/login" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
              Voltar para o login
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-purple-200 text-sm">
            © 2024 EntregasWoo - Sistema de Gestão
          </p>
        </div>
      </div>
    </div>
  );
}

// Não usar layout para esta página
RecuperarSenha.noLayout = true;