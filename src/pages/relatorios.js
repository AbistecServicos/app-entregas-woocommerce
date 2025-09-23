// pages/relatorios.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
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
  const [error, setError] = useState(null);

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
    }
  }, [userLoading, periodo]);

  // ==========================================================================
  // 5. CARREGAR RELATÓRIOS PRINCIPAIS
  // ==========================================================================
  const carregarRelatorios = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let dados = null;

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
      setError('Erro ao carregar relatórios. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // 6. RELATÓRIOS PARA ADMIN - SIMPLIFICADO
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
        frete_pago_semana,
        frete_pago_mes,
        frete_pago_ano,
        usuarios:uid_usuario(nome_completo, email)
      `)
      .eq('status_vinculacao', 'ativo')
      .eq('funcao', 'entregador');

    if (error) throw error;

    const lojasCorrigidas = data.map(loja => ({
      ...loja,
      loja_nome: corrigirNomeLoja(loja.id_loja, loja.loja_nome)
    }));

    const totalEntregas = lojasCorrigidas.reduce((sum, item) => sum + (item[`${periodo}_entregue`] || 0), 0);
    const totalCancelamentos = lojasCorrigidas.reduce((sum, item) => sum + (item[`${periodo}_cancelado`] || 0), 0);
    const totalFretesPagos = lojasCorrigidas.reduce((sum, item) => sum + (item[`frete_pago_${periodo}`] || 0), 0);
    const totalEntregadores = new Set(lojasCorrigidas.map(item => item.uid_usuario)).size;

    return {
      tipo: 'admin',
      totalEntregas,
      totalCancelamentos,
      totalFretesPagos,
      totalEntregadores,
      lojas: lojasCorrigidas,
      periodo
    };
  };

  // ==========================================================================
  // 7. RELATÓRIOS PARA GERENTE - SIMPLIFICADO
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
        frete_pago_semana,
        frete_pago_mes,
        frete_pago_ano,
        veiculo
      `)
      .eq('id_loja', idLoja)
      .eq('status_vinculacao', 'ativo')
      .eq('funcao', 'entregador')
      .order('mes_entregue', { ascending: false });

    if (error) throw error;

    const totalEntregas = data.reduce((sum, item) => sum + (item[`${periodo}_entregue`] || 0), 0);
    const totalCancelamentos = data.reduce((sum, item) => sum + (item[`${periodo}_cancelado`] || 0), 0);
    const totalFretesPagos = data.reduce((sum, item) => sum + (item[`frete_pago_${periodo}`] || 0), 0);
    const totalEntregadores = new Set(data.map(item => item.uid_usuario)).size;

    return {
      tipo: 'gerente',
      totalEntregas,
      totalCancelamentos,
      totalFretesPagos,
      totalEntregadores: data.length,
      entregadores: data,
      loja: nomeLojaCorrigido,
      periodo
    };
  };

  // ==========================================================================
  // 8. RELATÓRIOS PARA ENTREGADOR - ATUALIZADO
  // ==========================================================================
  const carregarRelatoriosEntregador = async () => {
    // DADOS DO DIA (HOJE) - Vem da estatisticas_diarias
    const hoje = new Date().toISOString().split('T')[0];
    const { data: dadosHoje, error: errorHoje } = await supabase
      .from('estatisticas_diarias')
      .select(`
        id_loja,
        entregues,
        cancelados,
        total_frete
      `)
      .eq('uid_usuario', userProfile?.uid)
      .eq('data', hoje);

    if (errorHoje) console.error('Erro ao carregar dados do dia:', errorHoje);

    // Calcular totais do dia
    const entreguesHoje = dadosHoje?.reduce((sum, item) => sum + (item.entregues || 0), 0) || 0;
    const cancelamentosHoje = dadosHoje?.reduce((sum, item) => sum + (item.cancelados || 0), 0) || 0;
    const freteOferecidoHoje = dadosHoje?.reduce((sum, item) => sum + (item.total_frete || 0), 0) || 0;

    // DADOS ACUMULADOS (SEMANA/MÊS/ANO) - Vem da loja_associada
    const { data: dadosAcumulados, error: errorAcumulado } = await supabase
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
        frete_pago_semana,
        frete_pago_mes,
        frete_pago_ano
      `)
      .eq('uid_usuario', userProfile?.uid)
      .eq('status_vinculacao', 'ativo');

    if (errorAcumulado) throw errorAcumulado;

    const lojasCorrigidas = dadosAcumulados.map(loja => ({
      ...loja,
      loja_nome: corrigirNomeLoja(loja.id_loja, loja.loja_nome)
    }));

    const totalEntregas = lojasCorrigidas.reduce((sum, item) => sum + (item[`${periodo}_entregue`] || 0), 0);
    const totalCancelamentos = lojasCorrigidas.reduce((sum, item) => sum + (item[`${periodo}_cancelado`] || 0), 0);
    const totalFretesPagos = periodo === 'dia' ? 0 : lojasCorrigidas.reduce((sum, item) => sum + (item[`frete_pago_${periodo}`] || 0), 0);

    return {
      tipo: 'entregador',
      // Dados do dia
      entreguesHoje,
      cancelamentosHoje,
      freteOferecidoHoje,
      dadosHojePorLoja: dadosHoje || [],
      
      // Dados acumulados
      totalEntregas,
      totalCancelamentos,
      totalFretesPagos,
      lojas: lojasCorrigidas,
      periodo
    };
  };

  // ==========================================================================
  // 9. COMPONENTE DE CARREGAMENTO
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
  // 10. RENDERIZAÇÃO PRINCIPAL
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

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* RENDERIZAÇÃO ESPECÍFICA POR TIPO DE USUÁRIO */}
        {userRole === 'entregador' && (
          <RenderRelatoriosEntregador dados={dadosRelatorios} periodo={periodo} />
        )}

        {userRole === 'gerente' && (
          <RenderRelatoriosGerente dados={dadosRelatorios} periodo={periodo} />
        )}

        {userRole === 'admin' && (
          <RenderRelatoriosAdmin dados={dadosRelatorios} periodo={periodo} />
        )}
      </div>
    </RouteGuard>
  );
}

// ============================================================================
// COMPONENTE: RENDERIZAÇÃO ENTREGADOR
// ============================================================================
function RenderRelatoriosEntregador({ dados, periodo }) {
  if (!dados) return null;

  return (
    <>
      {/* ESTATÍSTICAS DE HOJE */}
      <div className="bg-blue-50 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">🕒 Estatísticas de Hoje</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">{dados.entreguesHoje || 0}</div>
            <div className="text-sm text-gray-600">Entregas Hoje</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-red-600 mb-1">{dados.cancelamentosHoje || 0}</div>
            <div className="text-sm text-gray-600">Cancelamentos</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              R$ {(dados.freteOferecidoHoje || 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Frete Oferecido</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {new Date().toLocaleDateString('pt-BR')}
            </div>
            <div className="text-sm text-gray-600">Data</div>
          </div>
        </div>

        {/* DETALHES POR LOJA (HOJE) */}
        {dados.dadosHojePorLoja && dados.dadosHojePorLoja.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Detalhes por Loja (Hoje):</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {dados.dadosHojePorLoja.map((item, index) => (
                <div key={index} className="bg-white p-3 rounded border text-xs">
                  <div className="font-medium">Loja {item.id_loja}</div>
                  <div>Entregas: {item.entregues || 0}</div>
                  <div>Cancel: {item.cancelados || 0}</div>
                  <div>Frete: R$ {(item.total_frete || 0).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ESTATÍSTICAS ACUMULADAS */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {periodo === 'dia' ? 'Estatísticas de Hoje' : 
           periodo === 'semana' ? 'Estatísticas da Semana' :
           periodo === 'mes' ? 'Estatísticas do Mês' : 'Estatísticas do Ano'}
        </h2>

        {/* CARDS SIMPLIFICADOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-50 p-6 rounded-lg shadow-sm text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{dados.totalEntregas || 0}</div>
            <div className="text-gray-600">Total de Entregas</div>
          </div>
          
          <div className="bg-red-50 p-6 rounded-lg shadow-sm text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">{dados.totalCancelamentos || 0}</div>
            <div className="text-gray-600">Cancelamentos</div>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg shadow-sm text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              R$ {(dados.totalFretesPagos || 0).toFixed(2)}
            </div>
            <div className="text-gray-600">Frete Pago</div>
          </div>
        </div>

        {/* LISTA COMPACTA POR LOJA */}
        <h3 className="text-lg font-medium mb-4">🏪 Desempenho por Loja</h3>
        
        {dados.lojas && dados.lojas.length > 0 ? (
          <div className="space-y-3">
            {dados.lojas.map((loja, index) => {
              const entregas = loja[`${periodo}_entregue`] || 0;
              const cancelamentos = loja[`${periodo}_cancelado`] || 0;
              const fretePago = periodo === 'dia' ? 0 : (loja[`frete_pago_${periodo}`] || 0);
              
              return (
                <div key={index} className="p-3 border rounded-lg bg-gray-50 grid grid-cols-4 gap-4 text-sm">
                  <div className="font-medium">{loja.loja_nome}</div>
                  <div>📦 {entregas} entr.</div>
                  <div>❌ {cancelamentos} canc.</div>
                  <div className="font-semibold text-green-600">R$ {fretePago.toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">Nenhum dado encontrado</p>
        )}
      </div>
    </>
  );
}

// ============================================================================
// COMPONENTE: RENDERIZAÇÃO GERENTE
// ============================================================================
function RenderRelatoriosGerente({ dados, periodo }) {
  if (!dados) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">
        {periodo === 'dia' ? 'Estatísticas de Hoje' : 
         periodo === 'semana' ? 'Estatísticas da Semana' :
         periodo === 'mes' ? 'Estatísticas do Mês' : 'Estatísticas do Ano'} - {dados.loja}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-green-50 p-6 rounded-lg shadow-sm text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{dados.totalEntregas || 0}</div>
          <div className="text-gray-600">Total de Entregas</div>
        </div>
        
        <div className="bg-red-50 p-6 rounded-lg shadow-sm text-center">
          <div className="text-3xl font-bold text-red-600 mb-2">{dados.totalCancelamentos || 0}</div>
          <div className="text-gray-600">Cancelamentos</div>
        </div>
        
        <div className="bg-blue-50 p-6 rounded-lg shadow-sm text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            R$ {(dados.totalFretesPagos || 0).toFixed(2)}
          </div>
          <div className="text-gray-600">Frete Pago</div>
        </div>
        
        <div className="bg-purple-50 p-6 rounded-lg shadow-sm text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">{dados.totalEntregadores || 0}</div>
          <div className="text-gray-600">Entregadores</div>
        </div>
      </div>

      {/* DETALHES POR ENTREGADOR */}
      <h3 className="text-lg font-medium mb-4">👥 Desempenho por Entregador</h3>
      
      {dados.entregadores && dados.entregadores.length > 0 ? (
        <div className="space-y-4">
          {dados.entregadores.map((entregador, index) => {
            const entregas = entregador[`${periodo}_entregue`] || 0;
            const cancelamentos = entregador[`${periodo}_cancelado`] || 0;
            const fretePago = periodo === 'dia' ? 0 : (entregador[`frete_pago_${periodo}`] || 0);
            
            return (
              <div key={index} className="p-4 border rounded-lg bg-gray-50 grid grid-cols-5 gap-4 text-sm">
                <div className="font-medium col-span-2">{entregador.nome_completo}</div>
                <div>📦 {entregas} entr.</div>
                <div>❌ {cancelamentos} canc.</div>
                <div className="font-semibold text-green-600">R$ {fretePago.toFixed(2)}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">Nenhum entregador encontrado</p>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENTE: RENDERIZAÇÃO ADMIN
// ============================================================================
function RenderRelatoriosAdmin({ dados, periodo }) {
  if (!dados) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">
        {periodo === 'dia' ? 'Estatísticas de Hoje' : 
         periodo === 'semana' ? 'Estatísticas da Semana' :
         periodo === 'mes' ? 'Estatísticas do Mês' : 'Estatísticas do Ano'} - Sistema Completo
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-green-50 p-6 rounded-lg shadow-sm text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{dados.totalEntregas || 0}</div>
          <div className="text-gray-600">Total de Entregas</div>
        </div>
        
        <div className="bg-red-50 p-6 rounded-lg shadow-sm text-center">
          <div className="text-3xl font-bold text-red-600 mb-2">{dados.totalCancelamentos || 0}</div>
          <div className="text-gray-600">Cancelamentos</div>
        </div>
        
        <div className="bg-blue-50 p-6 rounded-lg shadow-sm text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            R$ {(dados.totalFretesPagos || 0).toFixed(2)}
          </div>
          <div className="text-gray-600">Frete Pago</div>
        </div>
        
        <div className="bg-purple-50 p-6 rounded-lg shadow-sm text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">{dados.totalEntregadores || 0}</div>
          <div className="text-gray-600">Entregadores</div>
        </div>
      </div>

      {/* DETALHES POR LOJA */}
      <h3 className="text-lg font-medium mb-4">🏢 Desempenho por Loja</h3>
      
      {dados.lojas && dados.lojas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dados.lojas.map((loja, index) => {
            const entregas = loja[`${periodo}_entregue`] || 0;
            const cancelamentos = loja[`${periodo}_cancelado`] || 0;
            const fretePago = periodo === 'dia' ? 0 : (loja[`frete_pago_${periodo}`] || 0);
            
            return (
              <div key={index} className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium mb-2">{loja.loja_nome}</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>📦 {entregas} entr.</div>
                  <div>❌ {cancelamentos} canc.</div>
                  <div className="font-semibold text-green-600">R$ {fretePago.toFixed(2)}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">Nenhuma loja encontrada</p>
      )}
    </div>
  );
}