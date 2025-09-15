// components/OrderModal/WithoutCourier.js
import React from 'react';

const WithoutCourier = ({ pedido, onClose }) => {
  const formatarData = (dataString) => {
    if (!dataString) return '-';
    try {
      return new Date(dataString).toLocaleDateString('pt-BR');
    } catch {
      return dataString;
    }
  };

  return (
    <>
      {/* Informações da Loja */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">{pedido.loja_nome}</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>ID:</strong> {pedido.id}</p>
            <p><strong>Pedido:</strong> {pedido.id_loja_woo}</p>
            <p><strong>Data:</strong> {formatarData(pedido.data)}</p>
          </div>
          <div>
            <p><strong>Telefone:</strong> {pedido.loja_telefone || 'N/A'}</p>
            <p><strong>Status:</strong> {pedido.status_transporte || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Cliente */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold text-gray-800 mb-2">Cliente</h4>
        <p><strong>Nome:</strong> {pedido.nome_cliente || 'N/A'}</p>
        <p><strong>Telefone:</strong> {pedido.telefone_cliente || 'N/A'}</p>
        <p><strong>Email:</strong> {pedido.email_cliente || 'N/A'}</p>
        <p><strong>Endereço:</strong> {pedido.endereco_entrega || 'N/A'}</p>
      </div>

      {/* Produtos */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-800 mb-2">Produtos</h4>
        <div className="bg-white border rounded p-3">
          {pedido.produto ? (
            <pre className="text-sm whitespace-pre-wrap">{pedido.produto}</pre>
          ) : (
            <p>Nenhum produto informado</p>
          )}
        </div>
      </div>

      {/* Pagamento */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p><strong>Forma de Pagamento:</strong> {pedido.forma_pagamento || 'N/A'}</p>
          <p><strong>Total:</strong> R$ {parseFloat(pedido.total || 0).toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {/* Observações */}
      {pedido.observacao_pedido && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 mb-2">Observações</h4>
          <p className="bg-yellow-50 p-3 rounded">{pedido.observacao_pedido}</p>
        </div>
      )}

      {/* Botão Fechar */}
      <div className="flex justify-end">
        <button onClick={onClose} className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">
          Fechar
        </button>
      </div>
    </>
  );
};

export default WithoutCourier;