// components/EditUsuarioModal.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function EditUsuarioModal({ isOpen, onClose, userProfile }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: '',
    nome_usuario: '',
    telefone: '',
    foto: ''
  });

  useEffect(() => {
    if (isOpen && userProfile) {
      setFormData({
        nome_completo: userProfile.nome_completo || '',
        nome_usuario: userProfile.nome_usuario || '',
        telefone: userProfile.telefone || '',
        foto: userProfile.foto || ''
      });
    }
  }, [isOpen, userProfile]);

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('usuarios')
        .update({
          nome_completo: formData.nome_completo,
          nome_usuario: formData.nome_usuario,
          telefone: formData.telefone,
          foto: formData.foto
        })
        .eq('uid', userProfile.uid);

      if (error) throw error;

      alert('Dados pessoais atualizados com sucesso!');
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      alert('Erro ao atualizar dados');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 max-w-95vw">
        <h2 className="text-xl font-bold text-gray-800 mb-4">✏️ Editar Dados Pessoais</h2>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
            <input
              type="text"
              value={formData.nome_completo}
              onChange={(e) => setFormData({...formData, nome_completo: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nome de Usuário</label>
            <input
              type="text"
              value={formData.nome_usuario}
              onChange={(e) => setFormData({...formData, nome_usuario: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Telefone</label>
            <input
              type="tel"
              value={formData.telefone}
              onChange={(e) => setFormData({...formData, telefone: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">URL da Foto</label>
            <input
              type="url"
              value={formData.foto}
              onChange={(e) => setFormData({...formData, foto: e.target.value})}
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
            className="flex-1 bg-purple-600 text-white py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}