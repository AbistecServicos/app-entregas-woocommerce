// src/components/OrderModal/DetalheLojaModal.js
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase'; // Caminho corrigido

export default function DetalheLojaModal({ loja, isOpen, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    loja_nome: '',
    id_loja: '',
    loja_endereco: '',
    loja_telefone: '',
    cnpj: '',
    loja_perimetro_entrega: '',
    ativa: true,
    loja_logo: null
  });

  // Preencher formData quando a loja mudar ou o modal abrir
  useEffect(() => {
    if (loja) {
      setFormData({
        loja_nome: loja.loja_nome || '',
        id_loja: loja.id_loja || '',
        loja_endereco: loja.loja_endereco || '',
        loja_telefone: loja.loja_telefone || '',
        cnpj: loja.cnpj || '',
        loja_perimetro_entrega: loja.loja_perimetro_entrega || '',
        ativa: loja.ativa || false,
        loja_logo: null
      });
    }
  }, [loja, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      let loja_logo_url = loja.loja_logo;

      // Upload da nova logo se foi selecionada
      if (formData.loja_logo instanceof File) {
        const fileExt = formData.loja_logo.name.split('.').pop();
        const fileName = `logo_loja_${formData.id_loja}_${Date.now()}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('box')
          .upload(filePath, formData.loja_logo, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('box')
          .getPublicUrl(filePath);
        
        loja_logo_url = publicUrl;
      }

      // Atualizar a loja
      const { error: updateError } = await supabase
        .from('lojas')
        .update({
          loja_nome: formData.loja_nome,
          id_loja: formData.id_loja,
          loja_endereco: formData.loja_endereco,
          loja_telefone: formData.loja_telefone,
          cnpj: formData.cnpj,
          loja_perimetro_entrega: formData.loja_perimetro_entrega,
          ativa: formData.ativa,
          loja_logo: loja_logo_url,
          data_atualizacao: new Date().toISOString()
        })
        .eq('id', loja.id);

      if (updateError) throw updateError;

      onUpdate();
      onClose();
    } catch (err) {
      setError('Erro ao atualizar loja: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        loja_logo: file
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Editar Loja: {loja?.loja_nome}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Loja *
              </label>
              <input
                type="text"
                name="loja_nome"
                value={formData.loja_nome}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID da Loja *
              </label>
              <input
                type="text"
                name="id_loja"
                value={formData.id_loja}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endereço
              </label>
              <input
                type="text"
                name="loja_endereco"
                value={formData.loja_endereco}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="text"
                name="loja_telefone"
                value={formData.loja_telefone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CNPJ
              </label>
              <input
                type="text"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Perímetro de Entrega
              </label>
              <input
                type="text"
                name="loja_perimetro_entrega"
                value={formData.loja_perimetro_entrega}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo da Loja
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
              {loja?.loja_logo && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Logo atual:</p>
                  <img 
                    src={loja.loja_logo} 
                    alt={`Logo ${loja.loja_nome}`}
                    className="h-16 w-auto object-contain border rounded mt-1"
                  />
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="ativa"
                  checked={formData.ativa}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Loja Ativa</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}