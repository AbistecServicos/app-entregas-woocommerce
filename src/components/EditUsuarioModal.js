// components/EditUsuarioModal.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ==============================================================================
// MODAL DE EDIÇÃO DE DADOS PESSOAIS DO USUÁRIO
// ==============================================================================
export default function EditUsuarioModal({ isOpen, onClose, userProfile }) {
  // ============================================================================
  // 1. DEFINIÇÃO DE ESTADOS
  // ============================================================================
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: '',
    nome_usuario: '',
    telefone: '',
    foto: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');

  // ============================================================================
  // 2. CARREGAR DADOS ATUAIS AO ABRIR MODAL
  // ============================================================================
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

  // ============================================================================
  // 3. FUNÇÃO: ATUALIZAR CAMPOS DO FORMULÁRIO
  // ============================================================================
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ============================================================================
  // 4. FUNÇÃO: NORMALIZAR NOME DO ARQUIVO (REMOVER ACENTOS)
  // ============================================================================
  const normalizeFileName = (fileName) => {
    return fileName
      .normalize('NFD') // Decompõe caracteres acentuados (ex.: ó → o + ̌)
      .replace(/[\u0300-\u036f]/g, '') // Remove os diacríticos (acentos)
      .replace(/[^a-zA-Z0-9.-]/g, '_'); // Substitui caracteres especiais por underscore
  };

  // ============================================================================
  // 5. FUNÇÃO: ATUALIZAR ARQUIVO DE FOTO
  // ============================================================================
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError(''); // Limpa erro se for uma imagem válida
    } else {
      setError('Por favor, selecione um arquivo de imagem.');
      setSelectedFile(null);
    }
  };

  // ============================================================================
  // 6. FUNÇÃO: SALVAR ALTERAÇÕES
  // ============================================================================
  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      let photoUrl = formData.foto;

      if (selectedFile) {
        // Normaliza o nome do arquivo para remover acentos
        const baseName = normalizeFileName(selectedFile.name);
        const fileName = `${userProfile.uid}-${Date.now()}-${baseName}`;
        const { error: uploadError } = await supabase.storage
          .from('box/fotos')
          .upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('box/fotos')
          .getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('usuarios')
        .update({
          nome_completo: formData.nome_completo,
          nome_usuario: formData.nome_usuario,
          telefone: formData.telefone,
          foto: photoUrl
        })
        .eq('uid', userProfile.uid);

      if (error) throw error;

      alert('Dados pessoais atualizados com sucesso!');
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      setError('Erro ao atualizar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // 7. RENDERIZAÇÃO DO COMPONENTE
  // ============================================================================
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 max-w-95vw">
        <h2 className="text-xl font-bold text-gray-800 mb-4">✏️ Editar Dados Pessoais</h2>
        
        {error && <div className="bg-red-50 border border-red-200 text-red-600 p-2 mb-4">{error}</div>}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
            <input
              type="text"
              name="nome_completo"
              value={formData.nome_completo}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nome de Usuário</label>
            <input
              type="text"
              name="nome_usuario"
              value={formData.nome_usuario}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Telefone</label>
            <input
              type="tel"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Foto de Perfil</label>
            {formData.foto && (
              <img
                src={formData.foto}
                alt="Foto atual"
                className="mt-2 h-20 w-20 object-cover rounded-full mb-2"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-2 border border-gray-300 rounded text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
            />
            <p className="text-xs text-gray-500 mt-1">Escolha uma imagem ou tire uma foto com a câmera.</p>
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