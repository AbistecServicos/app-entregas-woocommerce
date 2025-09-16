// pages/gestao-entregadores.js (VERSÃO MELHORADA)
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import { useUserProfile } from '../hooks/useUserProfile';

// ==============================================================================
// PÁGINA: GESTÃO DE ENTREGADORES
// ==============================================================================
export default function GestaoEntregadores() {
  const [entregadores, setEntregadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buscaEmail, setBuscaEmail] = useState('');
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);
  const [buscando, setBuscando] = useState(false);

  const router = useRouter();
  const { userRole, userLojas, loading: loadingUser } = useUserProfile();

  // ============================================================================
  // 1. VERIFICAÇÃO DE PERMISSÕES
  // ============================================================================
  useEffect(() => {
    if (!loadingUser && userRole !== 'admin' && userRole !== 'gerente') {
      alert('Acesso restrito a gerentes e administradores');
      router.push('/pedidos-pendentes');
    }
  }, [loadingUser, userRole, router]);

  // ============================================================================
  // 2. CARREGAR ENTREGADORES DA LOJA (COM MAIS CAMPOS)
  // ============================================================================
  useEffect(() => {
    if (userRole === 'gerente' || userRole === 'admin') {
      carregarEntregadores();
    }
  }, [userRole]);

  const carregarEntregadores = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('loja_associada')
        .select('*');

      // Gerente só vê pessoas da sua loja
      if (userRole === 'gerente' && userLojas.length > 0) {
        query = query.eq('id_loja', userLojas[0].id_loja);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Filtrar apenas entregadores e gerentes
      const pessoasLoja = data.filter(pessoa => 
        pessoa.funcao === 'entregador' || pessoa.funcao === 'gerente'
      );
      
      setEntregadores(pessoasLoja || []);
    } catch (error) {
      console.error('Erro ao carregar pessoas da loja:', error);
      alert('Erro ao carregar lista de pessoas');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // 3. BUSCAR USUÁRIO POR EMAIL NO SISTEMA (COM MAIS DETALHES)
  // ============================================================================
  const buscarUsuarioPorEmail = async () => {
    if (!buscaEmail.trim()) {
      alert('Por favor, digite um email para buscar');
      return;
    }
    
    try {
      setBuscando(true);
      
      // Buscar usuário na tabela usuarios pelo email
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('uid, email, nome_completo, telefone, foto')
        .eq('email', buscaEmail.trim())
        .single();

      if (usuarioError) {
        if (usuarioError.code === 'PGRST116') {
          setUsuarioEncontrado(null);
          alert('Usuário não encontrado no sistema');
        } else {
          throw usuarioError;
        }
        return;
      }

      // Buscar TODOS os detalhes das lojas associadas a este usuário
      const { data: lojasAssociadas, error: lojasError } = await supabase
        .from('loja_associada')
        .select('*')
        .eq('uid_usuario', usuario.uid);

      if (lojasError) throw lojasError;

      // Combinar dados do usuário com suas lojas
      setUsuarioEncontrado({
        ...usuario,
        lojasAssociadas: lojasAssociadas || []
      });

    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      alert('Erro ao buscar usuário. Verifique o console.');
      setUsuarioEncontrado(null);
    } finally {
      setBuscando(false);
    }
  };

  // ============================================================================
  // 4. VINCULAR USUÁRIO COMO ENTREGADOR
  // ============================================================================
  const vincularComoEntregador = async (usuario) => {
    if (!confirm(`Vincular ${usuario.nome_completo} como entregador nesta loja?`)) return;
    
    try {
      if (userRole === 'gerente' && (!userLojas || userLojas.length === 0)) {
        alert('Erro: Gerente não está vinculado a nenhuma loja');
        return;
      }

      const lojaId = userRole === 'gerente' ? userLojas[0].id_loja : prompt('Digite o ID da loja (admin):');
      const lojaNome = userRole === 'gerente' ? userLojas[0].loja_nome : prompt('Digite o nome da loja (admin):');

      if (!lojaId || !lojaNome) return;

      // Verificar se usuário já está vinculado a esta loja
      const { data: vinculoExistente } = await supabase
        .from('loja_associada')
        .select('id')
        .eq('uid_usuario', usuario.uid)
        .eq('id_loja', lojaId)
        .single();

      if (vinculoExistente) {
        alert('Este usuário já está vinculado a esta loja');
        return;
      }

      // Vincular usuário como entregador
      const { error } = await supabase
        .from('loja_associada')
        .insert({
          uid_usuario: usuario.uid,
          nome_completo: usuario.nome_completo,
          funcao: 'entregador',
          id_loja: lojaId,
          loja_nome: lojaNome,
          status_vinculacao: 'ativo',
          veiculo: 'Não informado',
          carga_maxima: 0,
          perimetro_entrega: 'Não definido',
          ultimo_status_vinculacao: new Date().toISOString()
        });

      if (error) throw error;

      alert('✅ Entregador vinculado com sucesso!');
      setBuscaEmail('');
      setUsuarioEncontrado(null);
      carregarEntregadores();
    } catch (error) {
      console.error('Erro ao vincular entregador:', error);
      alert('❌ Erro ao vincular entregador');
    }
  };

  // ============================================================================
  // 5. FUNÇÃO: FORMATAR VALOR NULO
  // ============================================================================
  const formatarValor = (valor) => {
    return valor || 'Não informado';
  };

  // ============================================================================
  // 6. RENDERIZAÇÃO DA PÁGINA
  // ============================================================================
  if (loadingUser) {
    return <div className="min-h-screen flex items-center justify-center">Carregando perfil...</div>;
  }

  if (userRole !== 'admin' && userRole !== 'gerente') {
    return <div className="min-h-screen flex items-center justify-center">Acesso não autorizado</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* TÍTULO */}
      <h1 className="text-2xl font-bold text-purple-800 mb-6">👥 Gestão de Entregadores</h1>

      {/* BUSCA POR EMAIL */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Buscar Usuário no Sistema</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="email"
            placeholder="Digite o email do usuário"
            value={buscaEmail}
            onChange={(e) => setBuscaEmail(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded"
            onKeyPress={(e) => e.key === 'Enter' && buscarUsuarioPorEmail()}
          />
          <button
            onClick={buscarUsuarioPorEmail}
            disabled={buscando}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {buscando ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {/* RESULTADO DA BUSCA - COM MAIS DETALHES */}
        {usuarioEncontrado && (
          <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded">
            <h3 className="font-semibold text-green-800 mb-3">👤 Usuário encontrado:</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <p><strong>Nome:</strong> {usuarioEncontrado.nome_completo}</p>
                <p><strong>Email:</strong> {usuarioEncontrado.email}</p>
                {usuarioEncontrado.telefone && (
                  <p><strong>Telefone:</strong> {usuarioEncontrado.telefone}</p>
                )}
              </div>
              
              {usuarioEncontrado.foto && (
                <div className="flex justify-center">
                  <img 
                    src={usuarioEncontrado.foto} 
                    alt="Foto do usuário"
                    className="w-16 h-16 rounded-full"
                  />
                </div>
              )}
            </div>

            <div className="mt-3">
              <strong>🏪 Lojas Associadas:</strong>
              {usuarioEncontrado.lojasAssociadas.length > 0 ? (
                <div className="ml-4 mt-2 space-y-2">
                  {usuarioEncontrado.lojasAssociadas.map((loja, index) => (
                    <div key={index} className="p-2 bg-white rounded border">
                      <p><strong>Loja:</strong> {loja.loja_nome} ({loja.id_loja})</p>
                      <p><strong>Função:</strong> 
                        <span className={`ml-1 ${
                          loja.funcao === 'gerente' ? 'text-purple-600 font-bold' : 'text-blue-600'
                        }`}>
                          {loja.funcao}
                        </span>
                      </p>
                      <p><strong>Status:</strong> 
                        <span className={`ml-1 ${
                          loja.status_vinculacao === 'ativo' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {loja.status_vinculacao}
                        </span>
                      </p>
                      {loja.veiculo && <p><strong>🚗 Veículo:</strong> {formatarValor(loja.veiculo)}</p>}
                      {loja.carga_maxima > 0 && <p><strong>📦 Carga Máxima:</strong> {loja.carga_maxima} kg</p>}
                      {loja.perimetro_entrega && <p><strong>📍 Perímetro:</strong> {formatarValor(loja.perimetro_entrega)}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 ml-4">Nenhuma loja associada</p>
              )}
            </div>

            <button
              onClick={() => vincularComoEntregador(usuarioEncontrado)}
              className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              ➕ Vincular como Entregador
            </button>
          </div>
        )}
      </div>

      {/* LISTA DE PESSOAS DA LOJA - COM MAIS DETALHES */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">
          {userRole === 'gerente' ? '👥 Pessoas da Minha Loja' : '👥 Pessoas do Sistema'}
        </h2>
        
        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : entregadores.length === 0 ? (
          <p className="text-gray-500">Nenhuma pessoa encontrada</p>
        ) : (
          <div className="grid gap-4">
            {entregadores.map((pessoa) => (
              <div key={pessoa.id} className="border p-4 rounded-lg bg-gray-50">
                <h3 className="font-semibold text-lg text-purple-800">
                  {pessoa.funcao === 'gerente' ? '👑 ' : '🚚 '}
                  {pessoa.nome_completo}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <div>
                    <p><strong>📧 Email:</strong> {pessoa.email_usuario}</p>
                    <p><strong>🎯 Função:</strong> 
                      <span className={`ml-1 ${
                        pessoa.funcao === 'gerente' ? 'text-purple-600 font-bold' : 'text-blue-600'
                      }`}>
                        {pessoa.funcao}
                      </span>
                    </p>
                    <p><strong>📊 Status:</strong> 
                      <span className={`ml-1 ${
                        pessoa.status_vinculacao === 'ativo' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {pessoa.status_vinculacao}
                      </span>
                    </p>
                  </div>
                  
                  <div>
                    <p><strong>🏪 Loja:</strong> {pessoa.loja_nome} ({pessoa.id_loja})</p>
                    <p><strong>🚗 Veículo:</strong> {formatarValor(pessoa.veiculo)}</p>
                    {pessoa.carga_maxima > 0 && (
                      <p><strong>📦 Carga Máx:</strong> {pessoa.carga_maxima} kg</p>
                    )}
                    {pessoa.perimetro_entrega && (
                      <p><strong>📍 Perímetro:</strong> {formatarValor(pessoa.perimetro_entrega)}</p>
                    )}
                  </div>
                </div>
                
                {pessoa.data_desligamento && (
                  <p className="text-red-600 text-sm mt-2">
                    <strong>🗓️ Data desligamento:</strong> {new Date(pessoa.data_desligamento).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}