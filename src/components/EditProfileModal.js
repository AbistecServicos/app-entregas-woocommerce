// components/EditProfileModal.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ==============================================================================
// MODAL DE EDIÇÃO DE PERFIL
// ==============================================================================
export default function EditProfileModal({ isOpen, onClose, userProfile, userRole, userLojas }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: '',
    nome_usuario: '',
    telefone: '',
    foto: '',
    veiculo: '',
    carga_maxima: '',
    perimetro_entrega: ''
  });

  // ============================================================================
  // 1. CARREGAR DADOS ATUAIS AO ABRIR MODAL
  // ============================================================================
  useEffect(() => {
    if (isOpen && userProfile) {
      setFormData({
        nome_completo: userProfile.nome_completo || '',
        nome_usuario: userProfile.nome_usuario || '',
        telefone: userProfile.telefone || '',
        foto: userProfile.foto || '',
        veiculo: userLojas[0]?.veiculo || '',
        carga_maxima: userLojas[0]?.carga_maxima || '',
        perimetro_entrega: userLojas[0]?.perimetro_entrega || ''
      });
    }
  }, [isOpen, userProfile, userLojas]);

  // ============================================================================
  // 2. FUNÇÃO: SALVAR ALTERAÇÕES
  // ============================================================================
  const handleSave = async () => {
    try {
      setLoading(true);

      const { error: userError } = await supabase
        .from('usuarios')
        .update({
          nome_completo: formData.nome_completo,
          nome_usuario: formData.nome_usuario,
          telefone: formData.telefone,
          foto: formData.foto
        })
        .eq('uid', userProfile.uid);

      if (userError) throw userError;

      if (userRole === 'entregador' && userLojas.length > 0) {
        const { error: lojaError } = await supabase
          .from('loja_associada')
          .update({
            veiculo: formData.veiculo,
            carga_maxima: formData.carga_maxima ? parseInt(formData.carga_maxima) : null,
            perimetro_entrega: formData.perimetro_entrega,
            nome_completo: formData.nome_completo
          })
          .eq('uid_usuario', userProfile.uid)
          .eq('id_loja', userLojas[0].id_loja);

        if (lojaError) throw lojaError;
      }

      alert('Perfil atualizado com sucesso!');
      onClose();
      window.location.reload();

    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 max-w-95vw max-h-95vh overflow-y-auto">
        
        {/* CABEÇALHO */}
        <h2 className="text-xl font-bold mb-4 text-gray-800">✏️ Editar Perfil</h2>
        
        {/* CAMPOS DO FORMULÁRIO */}
        <div className="space-y-4">
          {/* NOME COMPLETO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              value={formData.nome_completo}
              onChange={(e) => setFormData({...formData, nome_completo: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded text-gray-800 bg-white"
              placeholder="Seu nome completo"
            />
          </div>

          {/* NOME DE USUÁRIO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome de Usuário
            </label>
            <input
              type="text"
              value={formData.nome_usuario}
              onChange={(e) => setFormData({...formData, nome_usuario: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded text-gray-800 bg-white"
              placeholder="Seu nome de usuário"
            />
          </div>

          {/* TELEFONE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              value={formData.telefone}
              onChange={(e) => setFormData({...formData, telefone: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded text-gray-800 bg-white"
              placeholder="(11) 99999-9999"
            />
          </div>

          {/* FOTO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL da Foto
            </label>
            <input
              type="url"
              value={formData.foto}
              onChange={(e) => setFormData({...formData, foto: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded text-gray-800 bg-white"
              placeholder="https://exemplo.com/foto.jpg"
            />
          </div>

          {/* CAMPOS ESPECÍFICOS PARA ENTREGADORES */}
          {userRole === 'entregador' && (
            <>
              {/* VEÍCULO */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Veículo
                </label>
                <select
                  value={formData.veiculo}
                  onChange={(e) => setFormData({...formData, veiculo: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded text-gray-800 bg-white"
                >
                  <option value="">Selecione o veículo</option>
                  <option value="carro">Carro</option>
                  <option value="moto">Moto</option>
                  <option value="bicicleta">Bicicleta</option>
                  <option value="caminhao">Caminhão</option>
                  <option value="van">Van</option>
                </select>
              </div>

              {/* CARGA MÁXIMA */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carga Máxima (kg)
                </label>
                <input
                  type="number"
                  value={formData.carga_maxima}
                  onChange={(e) => setFormData({...formData, carga_maxima: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded text-gray-800 bg-white"
                  placeholder="Ex: 50"
                />
              </div>

              {/* PERÍMETRO DE ENTREGA */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Perímetro de Entrega
                </label>
                <input
                  type="text"
                  value={formData.perimetro_entrega}
                  onChange={(e) => setFormData({...formData, perimetro_entrega: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded text-gray-800 bg-white"
                  placeholder="Ex: Zona Norte, até 10km"
                />
              </div>
            </>
          )}
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded font-medium hover:bg-gray-400 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}