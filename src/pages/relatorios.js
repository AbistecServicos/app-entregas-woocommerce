// pages/relatorios.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';
import RouteGuard from '../components/RouteGuard';

export default function Relatorios() {
  const { userRole, userLojas, userProfile, loading: userLoading } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const [dadosRelatorios, setDadosRelatorios] = useState(null);
  const [periodo, setPeriodo] = useState('mes'); // dia, semana, mes, ano

  useEffect(() => {
    if (!userLoading) {
      carregarRelatorios();
    }
  }, [userLoading, periodo]);

  const carregarRelatorios = async () => {
    try {
      setLoading(true);
      
      let dados = null;

      // 📊 LÓGICA POR TIPO DE USUÁRIO
      if (userRole === 'admin') {
        dados = await carregarRelatoriosAdmin();
      } else if (userRole === 'gerente') {
        dados = await carregarRelatoriosGerente();
      } else if (userRole === 'entregador') {
        dados = await carregarRelatoriosEntregador();
      }

      setDadosRelatorios(dados);
      
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  // 👑 RELATÓRIOS PARA ADMIN - TODAS AS LOJAS
  const carregarRelatoriosAdmin = async () => {
    const { data, error } = await supabase
      .from('loja_associada')
      .select(`
        id_loja,
        loja_nome,
        semana_entregue,
        mes_entregue,
        ano_entregue,
        usuarios:uid_usuario(nome_completo, email)
      `)
      .eq('status_vinculacao', 'ativo')
      .eq('funcao', 'entregador');

    if (error) throw error;

    const totalEntregas = data.reduce((sum, item) => sum + item[`${periodo}_entregue`], 0);
    const totalEntregadores = new Set(data.map(item => item.uid_usuario)).size;

    return {
      tipo: 'admin',
      totalEntregas,
      totalEntregadores,
      lojas: data,
      periodo
    };
  };

  // 💼 RELATÓRIOS PARA GERENTE - APENAS SUA LOJA
  const carregarRelatoriosGerente = async () => {
    if (!userLojas || userLojas.length === 0) return null;

    const idLoja = userLojas[0].id_loja;

    const { data, error } = await supabase
      .from('loja_associada')
      .select(`
        nome_completo,
        email_usuario,
        semana_entregue,
        mes_entregue,
        ano_entregue,
        veiculo
      `)
      .eq('id_loja', idLoja)
      .eq('status_vinculacao', 'ativo')
      .eq('funcao', 'entregador')
      .order('mes_entregue', { ascending: false });

    if (error) throw error;

    const totalEntregas = data.reduce((sum, item) => sum + item[`${periodo}_entregue`], 0);

    return {
      tipo: 'gerente',
      totalEntregas,
      totalEntregadores: data.length,
      entregadores: data,
      loja: userLojas[0].loja_nome,
      periodo
    };
  };

  // 🚚 RELATÓRIOS PARA ENTREGADOR - SEUS DADOS
  const carregarRelatoriosEntregador = async () => {
    const { data, error } = await supabase
      .from('loja_associada')
      .select(`
        id_loja,
        loja_nome,
        semana_entregue,
        mes_entregue,
        ano_entregue
      `)
      .eq('uid_usuario', userProfile?.uid)
      .eq('status_vinculacao', 'ativo');

    if (error) throw error;

    const totalEntregas = data.reduce((sum, item) => sum + item[`${periodo}_entregue`], 0);

    return {
      tipo: 'entregador',
      totalEntregas,
      lojas: data,
      periodo
    };
  };

  // 🎨 COMPONENTE DE CARREGAMENTO
  if (userLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <RouteGuard requiredRole="entregador">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-3xl font-bold text-purple-800 mb-4 md:mb-0">
            📊 Relatórios - {userRole?.toUpperCase()}
          </h1>
          
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="dia">Hoje</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mês</option>
            <option value="ano">Este Ano</option>
          </select>
        </div>

        {/* 📈 CARDS DE ESTATÍSTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {dadosRelatorios?.totalEntregas || 0}
            </div>
            <div className="text-gray-600">Total de Entregas</div>
          </div>
          
          {userRole !== 'entregador' && (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {dadosRelatorios?.totalEntregadores || 0}
              </div>
              <div className="text-gray-600">Total de Entregadores</div>
            </div>
          )}
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {periodo === 'dia' ? 'Hoje' : 
               periodo === 'semana' ? 'Esta Semana' :
               periodo === 'mes' ? 'Este Mês' : 'Este Ano'}
            </div>
            <div className="text-gray-600">Período</div>
          </div>
          
          {userRole === 'gerente' && (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {dadosRelatorios?.loja || 'N/A'}
              </div>
              <div className="text-gray-600">Loja</div>
            </div>
          )}
        </div>

        {/* 📋 DETALHES ESPECÍFICOS POR TIPO DE USUÁRIO */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            {userRole === 'admin' && '🏢 Todas as Lojas'}
            {userRole === 'gerente' && `👥 Entregadores - ${dadosRelatorios?.loja}`}
            {userRole === 'entregador' && '🏪 Minhas Lojas'}
          </h2>

          {userRole === 'admin' && dadosRelatorios?.lojas && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dadosRelatorios.lojas.map((loja, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">{loja.loja_nome}</h3>
                  <p className="text-gray-600">Entregas: {loja[`${periodo}_entregue`]}</p>
                </div>
              ))}
            </div>
          )}

          {userRole === 'gerente' && dadosRelatorios?.entregadores && (
            <div className="space-y-4">
              {dadosRelatorios.entregadores.map((entregador, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">{entregador.nome_completo}</h3>
                  <p className="text-gray-600">Entregas: {entregador[`${periodo}_entregue`]}</p>
                  <p className="text-gray-600">Veículo: {entregador.veiculo}</p>
                </div>
              ))}
            </div>
          )}

          {userRole === 'entregador' && dadosRelatorios?.lojas && (
            <div className="space-y-4">
              {dadosRelatorios.lojas.map((loja, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">{loja.loja_nome}</h3>
                  <p className="text-gray-600">Entregas: {loja[`${periodo}_entregue`]}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RouteGuard>
  );
}