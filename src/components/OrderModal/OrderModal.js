// components/OrderModal/OrderModal.js
import React from 'react';

const OrderModal = ({ 
  pedido, 
  isOpen, 
  onClose, 
  children 
}) => {
  if (!isOpen || !pedido) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Cabeçalho do Modal */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-purple-800">Detalhes do Pedido</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
              ×
            </button>
          </div>

          {/* Conteúdo específico (será injetado via children) */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default OrderModal;