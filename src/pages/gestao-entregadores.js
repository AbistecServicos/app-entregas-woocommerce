// pages/gestao-entregadores.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';

const GestaoEntregadores = () => {
  const { userRole, userLojas } = useUserProfile();
  const [emailBusca, setEmailBusca] = useState('');
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);
  const [entregadores, setEntregadores] = useState([]);

  // Buscar usuário por email
  const buscarUsuario = async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', emailBusca)
      .single();

    if (!error && data) {
      setUsuarioEncontrado(data);
    }
  };

  // Vincular usuário como entregador
  const vincularEntregador = async (usuario) => {
    const { error } = await supabase
      .from('loja_associada')
      .insert({
        uid_usuario: usuario.uid,
        nome_completo: usuario.nome_completo,
        funcao: 'entregador',
        id_loja: userLojas[0].id_loja, // Gerente só tem uma loja
        loja_nome: userLojas[0].loja_nome,
        status_vinculacao: 'ativo'
      });

    if (!error) {
      carregarEntregadores();
    }
  };

  // Carregar entregadores da loja
  const carregarEntregadores = async () => {
    const { data, error } = await supabase
      .from('loja_associada')
      .select('*')
      .eq('id_loja', userLojas[0].id_loja)
      .eq('funcao', 'entregador');

    if (!error) {
      setEntregadores(data);
    }
  };

  useEffect(() => {
    if (userRole === 'gerente') {
      carregarEntregadores();
    }
  }, [userRole]);

  if (userRole !== 'gerente' && userRole !== 'admin') {
    return <div>Acesso restrito a gerentes</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestão de Entregadores</h1>
      
      {/* Busca por email */}
      <div className="mb-6">
        <input
          type="email"
          placeholder="Buscar usuário por email"
          value={emailBusca}
          onChange={(e) => setEmailBusca(e.target.value)}
          className="border p-2 mr-2"
        />
        <button onClick={buscarUsuario} className="bg-blue-500 text-white p-2">
          Buscar
        </button>
      </div>

      {/* Resultado da busca */}
      {usuarioEncontrado && (
        <div className="mb-6 p-4 border rounded">
          <h3 className="font-bold">Usuário encontrado:</h3>
          <p>Nome: {usuarioEncontrado.nome_completo}</p>
          <p>Email: {usuarioEncontrado.email}</p>
          <button 
            onClick={() => vincularEntregador(usuarioEncontrado)}
            className="bg-green-500 text-white p-2 mt-2"
          >
            Vincular como Entregador
          </button>
        </div>
      )}

      {/* Lista de entregadores */}
      <div>
        <h3 className="text-xl font-bold mb-4">Entregadores da Loja</h3>
        {entregadores.map(entregador => (
          <div key={entregador.id} className="border p-4 mb-2 rounded">
            <p><strong>Nome:</strong> {entregador.nome_completo}</p>
            <p><strong>Status:</strong> {entregador.status_vinculacao}</p>
            <p><strong>Veículo:</strong> {entregador.veiculo || 'Não informado'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GestaoEntregadores;