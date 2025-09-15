// pages/test-modal.js
import React, { useState } from 'react';
import { OrderModal, WithCourier } from '../components/OrderModal';

export default function TestModal() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Dados de exemplo para testar
  const pedidoTeste = {
    id: 1,
    id_loja_woo: '12-739',
    loja_nome: '36 Luanda Hortifruti',
    loja_telefone: '(11) 9999-9999',
    status_transporte: 'entregue',
    nome_cliente: 'João Silva',
    telefone_cliente: '(11) 8888-8888',
    email_cliente: 'joao@email.com',
    endereco_entrega: 'Rua Teste, 123 - São Paulo',
    produto: '2x Maçã Verde\n1x Banana Nanica\n3x Laranja Lima',
    forma_pagamento: 'Cartão de Crédito',
    total: '89.90',
    aceito_por_nome: 'Almir da Silva Salles',
    aceito_por_telefone: '(11) 7777-7777',
    aceito_por_email: 'almir@entregador.com',
    observacao_pedido: 'Deixar na portaria'
  };

return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste do Modal</h1>
      
      <button 
        onClick={() => setIsModalOpen(true)}
        className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
      >
        Abrir Modal de Teste
      </button>

      <OrderModal 
        pedido={pedidoTeste} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
      >
        <WithCourier 
          pedido={pedidoTeste} 
          onClose={() => setIsModalOpen(false)} 
        />
      </OrderModal>
    </div>
  );
}