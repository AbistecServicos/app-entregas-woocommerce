// pages/relatorios.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';
import RouteGuard from '../components/RouteGuard';

// ============================================================================
// COMPONENTE PRINCIPAL - PÁGINA DE RELATÓRIOS
// ============================================================================
export default function Relatorios() {
  // ==========================================================================
  // 1. ESTADOS E HOOKS
  // ==========================================================================
  const { userRole, userLojas, userProfile, loading: userLoading } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const [dadosRelatorios, setDadosRelatorios] = useState(null);
  const [periodo, setPeriodo] = useState('mes'); // dia, semana, mes, ano
  const [dadosTempoReal, setDadosTempoReal] = useState([]); // Dados do dia atual

  // ==========================================================================
  // 2. MAPEAMENTO DOS NOMES DAS LOJAS
  // ==========================================================================
  const mapeamentoLojas = {
    'L1': 'Mercearia Luanda',
    'L2': 'Brasil Carne', 
    'L3': 'Mistos Angola',
    'L4': '3G Luanda'
  };

  // ==========================================================================
  // 3. FUNÇÃO PARA CORRIGIR NOME DA LOJA
  // ==========================================================================
  const corrigirNomeLoja = (idLoja, nomeOriginal) => {
    return mapeamentoLojas[idLoja] || nomeOriginal;
  };

  // ==========================================================================
  // 4. EFFECT PRINCIPAL - CARREGAR DADOS
  // ==========================================================================
  useEffect(() => {
    if (!userLoading) {
      carregarRelatorios();
      carregarDadosTempoReal(); // Dados do dia atual em tempo real
    }
  }, [userLoading, periodo]);

// ==========================================================================
// 5. CARREGAR DADOS EM TEMPO REAL (HOJE) - CORRIGIDO
// ==========================================================================
const carregarDadosTempoReal = async () => {
  try {
    // Data de hoje no formato YYYY-MM-DD
    const hoje = new Date().toISOString().split('T')[0];
    
    let query = supabase
      .from('pedidos')
      .select('*')
      .eq('status_transporte', 'entregue')
      .gte('ultimo_status', `${hoje}T00:00:00`)  // ✅ CORRIGIDO: ultimo_status em vez de data_entrega
      .lte('ultimo_status', `${hoje}T23:59:59`); // ✅ CORRIGIDO: ultimo_status em vez de data_entrega
    
    // Aplicar filtros por perfil
    if (userRole === 'gerente' && userLojas.length > 0) {
      query = query.eq('id_loja', userLojas[0].id_loja);
    } else if (userRole === 'entregador') {
      query = query.eq('aceito_por_uid', userProfile?.uid); // ✅ CORRIGIDO: aceito_por_uid em vez de aceito_por
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Processar dados para exibição
    const processados = data.map(pedido => ({
      id: pedido.id,
      pedido: pedido.id_loja_woo,
      cliente: pedido.nome_cliente,
      loja: corrigirNomeLoja(pedido.id_loja, pedido.loja_nome),
      entregador: pedido.aceito_por_nome,
      valor: pedido.frete_pago || 0,
      data: pedido.ultimo_status // ✅ CORRIGIDO: ultimo_status em vez de data_entrega
    }));
    
    setDadosTempoReal(processados);
  } catch (error) {
    console.error('Erro ao carregar dados em tempo real:', error);
  }
};

  // ==========================================================================
  // 6. CARREGAR RELATÓRIOS PRINCIPAIS (CUMULATIVOS)
  // ==========================================================================
  const carregarRelatorios = async () => {
    try {
      setLoading(true);
      
      let dados = null;

      // LÓGICA POR TIPO DE USUÁRIO
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

  // ==========================================================================
  // 7. RELATÓRIOS PARA ADMIN - TODAS AS LOJAS
  // ==========================================================================
  const carregarRelatoriosAdmin = async () => {
    const { data, error } = await supabase
      .from('loja_associada')
      .select(`
        id_loja,
        loja_nome,
        semana_entregue,
        semana_cancelado,
        mes_entregue,
        mes_cancelado,
        ano_entregue,
        ano_cancelado,
        usuarios:uid_usuario(nome_completo, email)
      `)
      .eq('status_vinculacao', 'ativo')
      .eq('funcao', 'entregador');

    if (error) throw error;

    // Aplicar correção dos nomes das lojas
    const lojasCorrigidas = data.map(loja => ({
      ...loja,
      loja_nome: corrigirNomeLoja(loja.id_loja, loja.loja_nome)
    }));

    const totalEntregas = lojasCorrigidas.reduce((sum, item) => sum + item[`${periodo}_entregue`], 0);
    const totalCancelamentos = lojasCorrigidas.reduce((sum, item) => sum + item[`${periodo}_cancelado`], 0);
    const totalEntregadores = new Set(lojasCorrigidas.map(item => item.uid_usuario)).size;
    const taxaSucesso = totalEntregas > 0 ? 
      ((totalEntregas - totalCancelamentos) / totalEntregas * 100).toFixed(1) : 0;

    return {
      tipo: 'admin',
      totalEntregas,
      totalCancelamentos,
      taxaSucesso,
      totalEntregadores,
      lojas: lojasCorrigidas,
      periodo
    };
  };

  // ==========================================================================
  // 8. RELATÓRIOS PARA GERENTE - APENAS SUA LOJA
  // ==========================================================================
  const carregarRelatoriosGerente = async () => {
    if (!userLojas || userLojas.length === 0) return null;

    const idLoja = userLojas[0].id_loja;
    const nomeLojaCorrigido = corrigirNomeLoja(idLoja, userLojas[0].loja_nome);

    const { data, error } = await supabase
      .from('loja_associada')
      .select(`
        nome_completo,
        email_usuario,
        semana_entregue,
        semana_cancelado,
        mes_entregue,
        mes_cancelado,
        ano_entregue,
        ano_cancelado,
        veiculo
      `)
      .eq('id_loja', idLoja)
      .eq('status_vinculacao', 'ativo')
      .eq('funcao', 'entregador')
      .order('mes_entregue', { ascending: false });

    if (error) throw error;

    const totalEntregas = data.reduce((sum, item) => sum + item[`${periodo}_entregue`], 0);
    const totalCancelamentos = data.reduce((sum, item) => sum + item[`${periodo}_cancelado`], 0);
    const taxaSucesso = totalEntregas > 0 ? 
      ((totalEntregas - totalCancelamentos) / totalEntregas * 100).toFixed(1) : 0;

    return {
      tipo: 'gerente',
      totalEntregas,
      totalCancelamentos,
      taxaSucesso,
      totalEntregadores: data.length,
      entregadores: data,
      loja: nomeLojaCorrigido,
      periodo
    };
  };

  // ==========================================================================
  // 9. RELATÓRIOS PARA ENTREGADOR - SEUS DADOS
  // ==========================================================================
  const carregarRelatoriosEntregador = async () => {
    const { data, error } = await supabase
      .from('loja_associada')
      .select(`
        id_loja,
        loja_nome,
        semana_entregue,
        semana_cancelado,
        mes_entregue,
        mes_cancelado,
        ano_entregue,
        ano_cancelado
      `)
      .eq('uid_usuario', userProfile?.uid)
      .eq('status_vinculacao', 'ativo');

    if (error) throw error;

    // Aplicar correção dos nomes das lojas
    const lojasCorrigidas = data.map(loja => ({
      ...loja,
      loja_nome: corrigirNomeLoja(loja.id_loja, loja.loja_nome)
    }));

    const totalEntregas = lojasCorrigidas.reduce((sum, item) => sum + item[`${periodo}_entregue`], 0);
    const totalCancelamentos = lojasCorrigidas.reduce((sum, item) => sum + item[`${periodo}_cancelado`], 0);
    const taxaSucesso = totalEntregas > 0 ? 
      ((totalEntregas - totalCancelamentos) / totalEntregas * 100).toFixed(1) : 0;

    return {
      tipo: 'entregador',
      totalEntregas,
      totalCancelamentos,
      taxaSucesso,
      lojas: lojasCorrigidas,
      periodo
    };
  };

  // ==========================================================================
  // 10. CALCULAR TOTAL DE FRETE DOS DADOS EM TEMPO REAL
  // ==========================================================================
  const calcularTotalFreteHoje = () => {
    return dadosTempoReal.reduce((total, pedido) => total + (pedido.valor || 0), 0);
  };

  // ==========================================================================
  // 11. COMPONENTE DE CARREGAMENTO
  // ==========================================================================
  if (userLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3">Carregando relatórios...</span>
      </div>
    );
  }

  // ==========================================================================
  // 12. RENDERIZAÇÃO PRINCIPAL
  // ==========================================================================
  return (
    <RouteGuard requiredRole="entregador">
      <div className="container mx-auto px-4 py-8">
        {/* CABEÇALHO E FILTROS */}
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

        {/* SEÇÃO DE DADOS EM TEMPO REAL (HOJE) */}
        <div className="bg-blue-50 p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">
            🕒 Entregas de Hoje (Tempo Real)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {dadosTempoReal.length}
              </div>
              <div className="text-sm text-gray-600">Entregas Hoje</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                R$ {calcularTotalFreteHoje().toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total em Fretes</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {new Date().toLocaleDateString('pt-BR')}
              </div>
              <div className="text-sm text-gray-600">Data</div>
            </div>
          </div>
          
          {/* LISTA DE ENTREGAS DO DIA */}
          {dadosTempoReal.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Loja</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosTempoReal.map((pedido, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-3 text-sm">{pedido.pedido}</td>
                      <td className="p-3 text-sm">{pedido.cliente}</td>
                      <td className="p-3 text-sm">{pedido.loja}</td>
                      <td className="p-3 text-sm font-medium">R$ {pedido.valor.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Nenhuma entrega registrada hoje</p>
          )}
        </div>

        {/* ESTATÍSTICAS CUMULATIVAS */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {periodo === 'dia' ? 'Estatísticas de Hoje' : 
             periodo === 'semana' ? 'Estatísticas da Semana' :
             periodo === 'mes' ? 'Estatísticas do Mês' : 'Estatísticas do Ano'}
          </h2>

          {/* CARDS DE ESTATÍSTICAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-green-50 p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {dadosRelatorios?.totalEntregas || 0}
              </div>
              <div className="text-gray-600">Total de Entregas</div>
            </div>
            
            <div className="bg-red-50 p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {dadosRelatorios?.totalCancelamentos || 0}
              </div>
              <div className="text-gray-600">Cancelamentos</div>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {dadosRelatorios?.taxaSucesso || 0}%
              </div>
              <div className="text-gray-600">Taxa de Sucesso</div>
            </div>
            
            {userRole !== 'entregador' && (
              <div className="bg-purple-50 p-6 rounded-lg shadow-sm text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {dadosRelatorios?.totalEntregadores || 0}
                </div>
                <div className="text-gray-600">Entregadores</div>
              </div>
            )}
          </div>

          {/* DETALHES ESPECÍFICOS POR TIPO DE USUÁRIO */}
          <h3 className="text-lg font-medium mb-4">
            {userRole === 'admin' && '🏢 Desempenho por Loja'}
            {userRole === 'gerente' && `👥 Desempenho por Entregador - ${dadosRelatorios?.loja}`}
            {userRole === 'entregador' && '🏪 Meu Desempenho por Loja'}
          </h3>

          {userRole === 'admin' && dadosRelatorios?.lojas && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dadosRelatorios.lojas.map((loja, index) => {
                const entregas = loja[`${periodo}_entregue`] || 0;
                const cancelamentos = loja[`${periodo}_cancelado`] || 0;
                const taxaSucesso = entregas > 0 ? 
                  ((entregas - cancelamentos) / entregas * 100).toFixed(1) : 0;
                
                return (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-2">{loja.loja_nome}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-semibold">Entregas:</span> {entregas}
                      </div>
                      <div>
                        <span className="font-semibold">Cancelamentos:</span> {cancelamentos}
                      </div>
                      <div>
                        <span className="font-semibold">Taxa Sucesso:</span> {taxaSucesso}%
                      </div>
                      <div>
                        <span className="font-semibold">Entregadores:</span> {loja.usuarios ? 1 : 0}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {userRole === 'gerente' && dadosRelatorios?.entregadores && (
            <div className="space-y-4">
              {dadosRelatorios.entregadores.map((entregador, index) => {
                const entregas = entregador[`${periodo}_entregue`] || 0;
                const cancelamentos = entregador[`${periodo}_cancelado`] || 0;
                const taxaSucesso = entregas > 0 ? 
                  ((entregas - cancelamentos) / entregas * 100).toFixed(1) : 0;
                
                return (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-2">{entregador.nome_completo}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="font-semibold">Entregas:</span> {entregas}
                      </div>
                      <div>
                        <span className="font-semibold">Cancelamentos:</span> {cancelamentos}
                      </div>
                      <div>
                        <span className="font-semibold">Taxa Sucesso:</span> {taxaSucesso}%
                      </div>
                      <div>
                        <span className="font-semibold">Veículo:</span> {entregador.veiculo}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {userRole === 'entregador' && dadosRelatorios?.lojas && (
            <div className="space-y-4">
              {dadosRelatorios.lojas.map((loja, index) => {
                const entregas = loja[`${periodo}_entregue`] || 0;
                const cancelamentos = loja[`${periodo}_cancelado`] || 0;
                const taxaSucesso = entregas > 0 ? 
                  ((entregas - cancelamentos) / entregas * 100).toFixed(1) : 0;
                
                return (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-2">{loja.loja_nome}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="font-semibold">Entregas:</span> {entregas}
                      </div>
                      <div>
                        <span className="font-semibold">Cancelamentos:</span> {cancelamentos}
                      </div>
                      <div>
                        <span className="font-semibold">Taxa Sucesso:</span> {taxaSucesso}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </RouteGuard>
  );
}