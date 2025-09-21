// components/EditLojaModal.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function EditLojaModal({ isOpen, onClose, loja }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    veiculo: '',
    carga_maxima: '',
    perimetro_entrega: ''
  });

  useEffect(() => {
    if (isOpen && loja) {
      setFormData({
        veiculo: loja.veiculo || '',
        carga_maxima: loja.carga_maxima || '',
        perimetro_entrega: loja.perimetro_entrega || ''
      });
    }
  }, [isOpen, loja]);

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('loja_associada')
        .update({
          veiculo: formData.veiculo,
          carga_maxima: formData.carga_maxima ? parseInt(formData.carga_maxima) : null,
          perimetro_entrega: formData.perimetro_entrega
        })
        .eq('id', loja.id);

      if (error) throw error;

      alert('Dados da loja atualizados com sucesso!');
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      alert('Erro ao atualizar dados da loja');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 max-w-95vw">
        <h2 className="text-xl font-bold text-gray-800 mb-4">🏪 Editar Loja: {loja.loja_nome}</h2>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Veículo</label>
            <select
              value={formData.veiculo}
              onChange={(e) => setFormData({...formData, veiculo: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded text-gray-800"
            >
              <option value="">Selecione o veículo</option>
              <option value="carro">Carro</option>
              <option value="moto">Moto</option>
              <option value="bicicleta">Bicicleta</option>
              <option value="caminhao">Caminhão</option>
              <option value="van">Van</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Carga Máxima (kg)</label>
            <input
              type="number"
              value={formData.carga_maxima}
              onChange={(e) => setFormData({...formData, carga_maxima: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Perímetro de Entrega</label>
            <input
              type="text"
              value={formData.perimetro_entrega}
              onChange={(e) => setFormData({...formData, perimetro_entrega: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded text-gray-800"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}