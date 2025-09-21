// components/EditUsuarioModal.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

// ==============================================================================
// MODAL DE EDIÇÃO SIMPLIFICADA: APENAS TELEFONE E FOTO
// ==============================================================================
export default function EditUsuarioModal({ isOpen, onClose, userProfile }) {
  // ============================================================================
  // 1. DEFINIÇÃO DE ESTADOS
  // ============================================================================
  const [loading, setLoading] = useState(false);
  const [telefone, setTelefone] = useState('');
  const [foto, setFoto] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [showRemovePhoto, setShowRemovePhoto] = useState(false);

  // ============================================================================
  // 2. CARREGAR DADOS ATUAIS AO ABRIR MODAL
  // ============================================================================
  useEffect(() => {
    if (isOpen && userProfile) {
      setTelefone(userProfile.telefone || '');
      setFoto(userProfile.foto || '');
    }
  }, [isOpen, userProfile]);

  // ============================================================================
  // 3. FUNÇÃO: NORMALIZAR NOME DO ARQUIVO
  // ============================================================================
  const normalizeFileName = (fileName) => {
    return fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_');
  };

  // ============================================================================
  // 4. FUNÇÃO: ATUALIZAR ARQUIVO DE FOTO
  // ============================================================================
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione um arquivo de imagem.');
        setSelectedFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('O arquivo excede o limite de 5MB.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  // ============================================================================
  // 5. FUNÇÃO: SALVAR ALTERAÇÕES (APENAS TELEFONE E FOTO)
  // ============================================================================
  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      let photoUrl = foto;
      let oldFileFullPath = null;

      // Identifica foto antiga para possível exclusão
      if (foto) {
        const url = new URL(foto);
        const pathParts = url.pathname.split('/');
        oldFileFullPath = pathParts.slice(4).join('/');
      }

      // Upload da nova foto (se houver)
      if (selectedFile) {
        const baseName = normalizeFileName(selectedFile.name);
        const fileName = `${userProfile.uid}-${Date.now()}-${baseName}`;
        const fullPath = `fotos/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('box')
          .upload(fullPath, selectedFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('box')
          .getPublicUrl(fullPath);
        photoUrl = urlData.publicUrl;
      }

      // Atualiza APENAS telefone e foto no banco
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          telefone: telefone,
          foto: photoUrl
        })
        .eq('uid', userProfile.uid);

      if (updateError) throw updateError;

      // Remove foto antiga se foi feita substituição
      if (oldFileFullPath && selectedFile) {
        try {
          await supabase.storage
            .from('box')
            .remove([oldFileFullPath]);
        } catch (deleteError) {
          console.warn('Aviso: Foto antiga não pôde ser removida:', deleteError);
        }
      }

      alert('Dados atualizados com sucesso!');
      onClose();
      window.location.reload();

    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setError(error.message || 'Erro ao atualizar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // 6. FUNÇÃO: REMOVER FOTO
  // ============================================================================
  const handleRemovePhoto = async () => {
    if (!foto) return;
    
    try {
      const url = new URL(foto);
      const pathParts = url.pathname.split('/');
      const fullPath = pathParts.slice(4).join('/');
      
      const { error: removeError } = await supabase.storage
        .from('box')
        .remove([fullPath]);
      
      if (removeError) throw removeError;
      
      // Atualiza estado local e banco
      setFoto('');
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ foto: '' })
        .eq('uid', userProfile.uid);

      if (updateError) throw updateError;

      setShowRemovePhoto(false);
      setSelectedFile(null);
      setError('');
      
      alert('Foto removida com sucesso!');
      
    } catch (error) {
      console.error('Erro ao remover foto:', error);
      setError('Erro ao remover foto. Tente novamente.');
    }
  };

  // ============================================================================
  // 7. RENDERIZAÇÃO DO MODAL SIMPLIFICADO
  // ============================================================================
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 max-w-95vw">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          ✏️ Editar Telefone e Foto
        </h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-2 mb-4 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Campo Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone *
            </label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-purple-500"
              required
              disabled={loading}
            />
          </div>

          {/* Seção de Foto de Perfil */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto de Perfil
            </label>
            
            {/* Preview da foto atual */}
            {foto && (
              <div className="relative inline-block mb-3">
                <img
                  src={foto}
                  alt="Foto atual do perfil"
                  className="h-20 w-20 object-cover rounded-full border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => setShowRemovePhoto(true)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold hover:bg-red-600"
                  disabled={loading}
                >
                  ×
                </button>
              </div>
            )}

            {/* Input para nova foto */}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-2 border border-gray-300 rounded text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-2">
              Escolha uma imagem (máx. 5MB). Formatos: JPG, PNG, GIF.
            </p>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded font-medium hover:bg-gray-300"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !telefone.trim()}
            className="flex-1 bg-purple-600 text-white py-2 rounded font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      {/* Modal de Confirmação para Remover Foto */}
      {showRemovePhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60">
          <div className="bg-white p-6 rounded-lg w-80 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Remover Foto</h3>
            <p className="text-gray-600 mb-5">
              Tem certeza que deseja remover sua foto de perfil?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRemovePhoto(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded font-medium hover:bg-gray-300"
              >
                Manter Foto
              </button>
              <button
                onClick={handleRemovePhoto}
                className="flex-1 bg-red-600 text-white py-2 rounded font-medium hover:bg-red-700"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}